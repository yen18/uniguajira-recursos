const express = require('express');
const router = express.Router();
const { rotateRefresh, revokeRefresh, setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE, signAccessToken, verifyToken } = require('../utils/auth');
const { validate, schemas } = require('../utils/validation');
const crypto = require('crypto');
const { sendOverrideNotification } = require('../utils/mailer');
const { pool } = require('../config/database');
const cookieParser = require('cookie-parser');

router.use(cookieParser());

// POST /api/auth/refresh - rotate refresh token and issue new access
router.post('/refresh', async (req, res) => {
  try {
    const oldToken = req.cookies[REFRESH_COOKIE];
    if (!oldToken) return res.status(401).json({ success:false, error:'missing_refresh_cookie' });
    let payload;
    try { payload = verifyToken(oldToken); } catch { return res.status(401).json({ success:false, error:'invalid_refresh_token' }); }
    // Obtener usuario
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id_usuario=? LIMIT 1', [payload.sub]);
    if (!rows.length) return res.status(401).json({ success:false, error:'user_not_found' });
    const user = rows[0];
    // Rotar refresh
    let newRefresh;
    try { newRefresh = await rotateRefresh(oldToken, user); } catch(e) { return res.status(401).json({ success:false, error:e.message }); }
    setRefreshCookie(res, newRefresh);
    const accessToken = signAccessToken(user);
    const { pass: _, ...userWithoutPassword } = user;
    res.json({ success:true, access_token: accessToken, data: userWithoutPassword, expires_in_min: parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '15',10) });
  } catch (e) {
    console.error('Error en refresh:', e);
    res.status(500).json({ success:false, error:'server_error' });
  }
});

// POST /api/auth/logout - revoke refresh token
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      try { await revokeRefresh(token); } catch (e) { /* ignore */ }
    }
    clearRefreshCookie(res);
    res.json({ success:true, message:'logout_ok' });
  } catch (e) {
    res.status(500).json({ success:false, error:'server_error' });
  }
});

module.exports = router;
/** PASSWORD RECOVERY **/
async function ensurePasswordResetTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwreset_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

// Solicitar reset
router.post('/password/forgot', validate(schemas.passwordForgot), async (req, res) => {
  try {
    await ensurePasswordResetTable();
    const { correo_electronico } = req.validated.body;
    const [rows] = await pool.execute('SELECT id_usuario, nombre, correo_electronico FROM usuarios WHERE correo_electronico=? LIMIT 1', [correo_electronico]);
    if (!rows.length) return res.status(200).json({ success:true, message:'ok' }); // no revelar inexistencia
    const user = rows[0];
    const ttlMin = parseInt(process.env.PASSWORD_RESET_TTL_MIN || '30', 10);
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + ttlMin*60*1000);
    await pool.execute('INSERT INTO password_resets (id_usuario, token_hash, expires_at) VALUES (?,?,?)', [user.id_usuario, tokenHash, expiresAt]);
    const resetBase = process.env.FRONTEND_RESET_URL || 'http://localhost:3000/reset-password';
    const link = `${resetBase}?token=${rawToken}`;
    // Enviar correo (reutilizamos transporter; sendOverrideNotification como placeholder)
    try { await sendOverrideNotification({ to: user.correo_electronico, recursoTipo:'Contraseña', recursoNombre:user.nombre, fecha:'', hora_inicio:'', hora_fin:'', motivo:`Restablecer: ${link}` }); } catch(e) { console.warn('No se pudo enviar correo reset:', e.message); }
    res.json({ success:true, message:'reset_requested', ttl_min: ttlMin });
  } catch (e) {
    console.error('Error forgot password:', e);
    res.status(500).json({ success:false, error:'server_error' });
  }
});

// Confirmar reset
router.post('/password/reset', validate(schemas.passwordReset), async (req, res) => {
  try {
    await ensurePasswordResetTable();
    const { token, pass } = req.validated.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.execute('SELECT * FROM password_resets WHERE token_hash=? LIMIT 1', [tokenHash]);
    if (!rows.length) return res.status(400).json({ success:false, error:'invalid_token' });
    const rec = rows[0];
    if (rec.used_at) return res.status(400).json({ success:false, error:'token_used' });
    if (new Date(rec.expires_at).getTime() < Date.now()) return res.status(400).json({ success:false, error:'token_expired' });
    // Actualizar contraseña (hash bcrypt)
    const { hashPassword } = require('../utils/auth');
    let hashed;
    try { hashed = await hashPassword(pass); } catch { return res.status(400).json({ success:false, error:'invalid_password' }); }
    await pool.execute('UPDATE usuarios SET pass=? WHERE id_usuario=?', [hashed, rec.id_usuario]);
    await pool.execute('UPDATE password_resets SET used_at=NOW() WHERE id=?', [rec.id]);
    res.json({ success:true, message:'password_updated' });
  } catch (e) {
    console.error('Error reset password:', e);
    res.status(500).json({ success:false, error:'server_error' });
  }
});
