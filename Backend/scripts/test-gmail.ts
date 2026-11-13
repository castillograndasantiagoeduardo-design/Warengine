/**
 * test-gmail.ts — Script aislado para verificar la conexión SMTP con Gmail.
 *
 * Uso:
 *   deno run --allow-net --allow-env --allow-read --env scripts/test-gmail.ts
 *
 * Antes de ejecutar:
 *   1. Habilita la verificación en dos pasos en tu cuenta Google.
 *   2. Genera una contraseña de aplicación en https://myaccount.google.com/apppasswords
 *   3. Agrega al .env:
 *        GMAIL_USER=tucuenta@gmail.com
 *        GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *        MAIL_FROM="Warengine <tucuenta@gmail.com>"
 *
 * Resultado esperado:
 *   ✅ transporter.verify() exitoso
 *   ✅ Correo de prueba enviado a GMAIL_USER
 */

import { createTransport } from 'nodemailer';

const GMAIL_USER = Deno.env.get('GMAIL_USER');
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
const MAIL_FROM = Deno.env.get('MAIL_FROM') || GMAIL_USER;

// ── Validación de variables ──────────────────────────────────────────────────
if (!GMAIL_USER) {
  console.error('❌ GMAIL_USER no está definida en .env');
  console.error('   Ejemplo: GMAIL_USER=tucuenta@gmail.com');
  Deno.exit(1);
}

if (!GMAIL_APP_PASSWORD) {
  console.error('❌ GMAIL_APP_PASSWORD no está definida en .env');
  console.error('   Pasos para obtenerla:');
  console.error('   1. Activa la verificación en dos pasos en tu cuenta Google');
  console.error('   2. Ve a https://myaccount.google.com/apppasswords');
  console.error('   3. Crea una contraseña de aplicación para "Correo" > "Otro (Warengine)"');
  console.error('   4. Copia la contraseña de 16 caracteres (con o sin espacios) en GMAIL_APP_PASSWORD');
  Deno.exit(1);
}

// ── Crear transporter ────────────────────────────────────────────────────────
const transporter = createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

// ── Paso 1: Verificar conexión ───────────────────────────────────────────────
console.log('🔄 Verificando conexión con smtp.gmail.com:465...');

try {
  await transporter.verify();
  console.log('✅ transporter.verify() exitoso — conexión SMTP autenticada correctamente.');
} catch (error: unknown) {
  const err = error as { code?: string; message?: string };
  console.error('❌ Error al verificar la conexión SMTP:');

  if (err.code === 'EAUTH') {
    console.error('   → Error de autenticación (EAUTH).');
    console.error('   → Verifica que:');
    console.error('     1. La verificación en dos pasos esté ACTIVADA en tu cuenta Google.');
    console.error('     2. GMAIL_APP_PASSWORD sea una contraseña de aplicación válida.');
    console.error('     3. NO uses tu contraseña normal de Gmail.');
    console.error('     4. Genera una nueva en: https://myaccount.google.com/apppasswords');
  } else if (err.code === 'ESOCKET' || err.code === 'ECONNREFUSED') {
    console.error('   → No se pudo conectar a smtp.gmail.com:465.');
    console.error('   → Verifica tu conexión a internet y que el puerto 465 no esté bloqueado.');
  } else {
    console.error(`   → Código: ${err.code ?? 'desconocido'}`);
    console.error(`   → Mensaje: ${err.message ?? 'sin detalle'}`);
  }
  Deno.exit(1);
}

// ── Paso 2: Enviar correo de prueba ──────────────────────────────────────────
console.log(`\n🔄 Enviando correo de prueba a ${GMAIL_USER}...`);

try {
  const codigoPrueba = '4827';
  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to: GMAIL_USER,
    subject: '🔐 Warengine — Código de prueba SMTP',
    text: [
      'Warengine — Verificación de correo SMTP',
      '',
      `Tu código de prueba es: ${codigoPrueba}`,
      '',
      'Si recibes este correo, la configuración SMTP funciona correctamente.',
      'Este código no tiene ninguna funcionalidad; es solo una prueba.',
    ].join('\n'),
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#f4f4f7;">
        <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2c5282 100%);padding:32px 24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">🔐 Warengine</h1>
            <p style="color:#a3bffa;margin:8px 0 0;font-size:14px;">Verificación de correo SMTP</p>
          </div>
          <div style="padding:32px 24px;text-align:center;">
            <p style="color:#4a5568;font-size:15px;margin:0 0 24px;">Tu código de prueba es:</p>
            <div style="display:inline-flex;gap:8px;margin-bottom:24px;">
              ${codigoPrueba.split('').map(d =>
                `<span style="display:inline-block;width:48px;height:56px;line-height:56px;font-size:28px;font-weight:700;color:#1e3a5f;background:#edf2f7;border-radius:8px;border:2px solid #cbd5e0;">${d}</span>`
              ).join('')}
            </div>
            <p style="color:#48bb78;font-size:14px;font-weight:600;margin:0 0 16px;">✅ ¡Configuración SMTP correcta!</p>
            <p style="color:#a0aec0;font-size:12px;margin:0;">Este código no tiene funcionalidad. Es solo una prueba de envío.</p>
          </div>
          <div style="background:#f7fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#a0aec0;font-size:11px;margin:0;">Warengine &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log(`✅ Correo enviado exitosamente.`);
  console.log(`   Message-ID: ${info.messageId}`);
  console.log(`   Respuesta del servidor: ${info.response}`);
  console.log(`\n🎉 ¡Todo listo! La configuración SMTP de Gmail funciona.`);
  console.log(`   Revisa la bandeja de entrada de ${GMAIL_USER}.`);
} catch (error: unknown) {
  const err = error as { code?: string; message?: string };
  console.error('❌ Error al enviar el correo de prueba:');
  console.error(`   Código: ${err.code ?? 'desconocido'}`);
  console.error(`   Mensaje: ${err.message ?? 'sin detalle'}`);
  Deno.exit(1);
}
