const nodemailer = require('nodemailer');

let transporterPromise = null;

async function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: !!process.env.SMTP_SECURE && process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  }
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then(account => {
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
      });
    });
  }
  return transporterPromise;
}

async function sendOverrideNotification({ to, recursoTipo, recursoNombre, fecha, hora_inicio, hora_fin, motivo }) {
  if (!to) return { skipped: true, reason: 'No destinatario' };
  const transporter = await getTransporter();
  const subject = 'Recurso reasignado por Administración';
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">\n<h2 style="color:#c0392b;">Recurso reasignado</h2>\n<p>Su reserva aprobada ha sido <strong>anulada por la administración</strong> debido a un requerimiento prioritario.</p>\n<table style="border-collapse:collapse;margin-top:10px;">\n<tr><td style="padding:4px 8px;border:1px solid #ddd;">Recurso</td><td style="padding:4px 8px;border:1px solid #ddd;">${recursoTipo} — ${recursoNombre}</td></tr>\n<tr><td style="padding:4px 8px;border:1px solid #ddd;">Fecha</td><td style="padding:4px 8px;border:1px solid #ddd;">${fecha}</td></tr>\n<tr><td style="padding:4px 8px;border:1px solid #ddd;">Horario</td><td style="padding:4px 8px;border:1px solid #ddd;">${hora_inicio} - ${hora_fin}</td></tr>\n<tr><td style="padding:4px 8px;border:1px solid #ddd;">Motivo</td><td style="padding:4px 8px;border:1px solid #ddd;">${motivo || 'No especificado'}</td></tr>\n</table>\n<p style="margin-top:15px;">Puede ingresar nuevamente al sistema para solicitar otro horario disponible.</p>\n<p style="font-size:12px;color:#666;">Este correo se genera automáticamente. No responda a este mensaje.</p>\n</body></html>`;
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Sistema Recursos" <no-reply@localhost>',
    to,
    subject,
    html
  });
  let previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
  return { messageId: info.messageId, previewUrl };
}

module.exports = { sendOverrideNotification };
