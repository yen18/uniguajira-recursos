const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const ACCESS_TTL_MIN = parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '15', 10);
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);
const REFRESH_COOKIE = process.env.REFRESH_TOKEN_COOKIE_NAME || 'refresh_token';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

async function ensureRefreshTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id_usuario, tipo: user.tipo_de_usuario },
    JWT_SECRET,
    { expiresIn: `${ACCESS_TTL_MIN}m` }
  );
}

function signRefreshToken(user, jti) {
  return jwt.sign(
    { sub: user.id_usuario, jti },
    JWT_SECRET,
    { expiresIn: `${REFRESH_TTL_DAYS}d` }
  );
}

async function generateAndStoreRefresh(user) {
  await ensureRefreshTable();
  const jti = crypto.randomUUID();
  const rawToken = signRefreshToken(user, jti);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24*60*60*1000);
  await pool.execute('INSERT INTO refresh_tokens (id_usuario, token_hash, expires_at) VALUES (?,?,?)', [user.id_usuario, tokenHash, expiresAt]);
  return rawToken;
}

async function revokeRefresh(token) {
  await ensureRefreshTable();
  const tokenHash = hashToken(token);
  await pool.execute('UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=? AND revoked_at IS NULL', [tokenHash]);
}

async function rotateRefresh(oldToken, user) {
  await ensureRefreshTable();
  const oldHash = hashToken(oldToken);
  const [rows] = await pool.execute('SELECT * FROM refresh_tokens WHERE token_hash=? AND revoked_at IS NULL LIMIT 1', [oldHash]);
  if (!rows.length) throw new Error('refresh_not_found');
  const rec = rows[0];
  if (new Date(rec.expires_at).getTime() < Date.now()) throw new Error('refresh_expired');
  // Revoke old
  await pool.execute('UPDATE refresh_tokens SET revoked_at=NOW() WHERE id=?', [rec.id]);
  // Create new
  const newToken = await generateAndStoreRefresh(user);
  return newToken;
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TTL_DAYS * 24*60*60*1000
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ success:false, error:'missing_bearer' });
  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    req.auth = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success:false, error:'invalid_token' });
  }
}

module.exports = {
  signAccessToken,
  generateAndStoreRefresh,
  rotateRefresh,
  revokeRefresh,
  setRefreshCookie,
  clearRefreshCookie,
  authMiddleware,
  verifyToken,
  REFRESH_COOKIE,
  // Password helpers
  hashPassword: async (plain) => {
    if (typeof plain !== 'string' || !plain) throw new Error('invalid_password');
    return bcrypt.hash(plain, 10);
  },
  isHashedPassword: (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value),
  verifyPassword: async (plain, stored) => {
    if (!stored) return false;
    const isHash = typeof stored === 'string' && /^\$2[aby]\$/.test(stored);
    if (isHash) return bcrypt.compare(plain, stored);
    return plain === stored; // soporte legado texto plano
  }
};
