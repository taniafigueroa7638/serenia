/**
 * Servicio de email usando Brevo API v3 (NO SMTP)
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'Serenia',
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Brevo API Error: ${JSON.stringify(error)}`);
  }

  return await response.json();
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationCode = async (email, code, nombre) => {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #f5f0ff 0%, #e8f5e9 100%); border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #5e35b1; font-size: 28px; margin: 0;">🧘 Serenia</h1>
        <p style="color: #7e57c2; font-size: 14px; margin-top: 8px;">Bienestar emocional</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(126,87,194,0.1);">
        <h2 style="color: #333; font-size: 20px; margin-bottom: 16px;">Hola ${nombre},</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">Gracias por registrarte en Serenia. Para completar tu registro, utiliza el siguiente código de verificación:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; background: linear-gradient(135deg, #7e57c2, #5e35b1); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #777; font-size: 13px; text-align: center;">Este código expira en 30 minutos.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px; text-align: center;">Si no solicitaste este registro, ignora este correo.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Código de verificación - Serenia',
    htmlContent: html,
    textContent: `Tu código de verificación Serenia es: ${code}. Expira en 30 minutos.`
  });
};

const sendPasswordReset = async (email, token, nombre) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #f5f0ff 0%, #e8f5e9 100%); border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #5e35b1; font-size: 28px; margin: 0;">🧘 Serenia</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(126,87,194,0.1);">
        <h2 style="color: #333; font-size: 20px; margin-bottom: 16px;">Hola ${nombre},</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7e57c2, #5e35b1); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Restablecer contraseña</a>
        </div>
        <p style="color: #777; font-size: 13px; text-align: center;">Este enlace expira en 1 hora.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px; text-align: center;">Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '🔑 Restablecer contraseña - Serenia',
    htmlContent: html,
    textContent: `Para restablecer tu contraseña, visita: ${resetUrl}. Expira en 1 hora.`
  });
};

module.exports = {
  sendVerificationCode,
  sendPasswordReset,
  generateCode
};
