import { createTransport, Transporter } from 'nodemailer';

export interface EnviarEmailOtpDto {
  para: string;
  codigoOtp: string;
  expiraEnMinutos: number;
}

export interface IOtpMailer {
  enviarCodigoOtp(dto: EnviarEmailOtpDto): Promise<void>;
}

export class GmailMailer implements IOtpMailer {
  private transporter: Transporter | null = null;
  private readonly from: string;
  private readonly user?: string;
  private readonly pass?: string;

  constructor() {
    this.user = Deno.env.get('GMAIL_USER');
    this.pass = Deno.env.get('GMAIL_APP_PASSWORD');
    this.from = Deno.env.get('MAIL_FROM') || (this.user ? `Warengine <${this.user}>` : 'Warengine <noreply@warengine.local>');

    if (this.user && this.pass) {
      this.transporter = createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });
    }
  }

  public async enviarCodigoOtp(dto: EnviarEmailOtpDto): Promise<void> {
    const digitos = dto.codigoOtp.split('');

    if (!this.transporter) {
      // Modo fallback para desarrollo local sin credenciales SMTP configuradas
      console.warn(
        `[GmailMailer] GMAIL_USER o GMAIL_APP_PASSWORD no configurados. Código OTP generado para ${dto.para}: [${dto.codigoOtp}] (vigencia: ${dto.expiraEnMinutos} min)`,
      );
      return;
    }

    const textoPlano = [
      'Warengine — Código de Recuperación de Contraseña',
      '',
      `Tu código de verificación es: ${dto.codigoOtp}`,
      '',
      `Este código es válido por ${dto.expiraEnMinutos} minutos y es de un solo uso.`,
      'Si no solicitaste este código, puedes ignorar este mensaje; tu cuenta sigue segura.',
    ].join('\n');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0b1329;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b1329;padding:40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width:480px;background:#14213d;border:1px solid #1e3a5f;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 24px 20px;text-align:center;background:radial-gradient(ellipse at top,#1e3a5f 0%,#14213d 100%);">
                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#e9b949;letter-spacing:1px;text-transform:uppercase;">Warengine</h1>
                    <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;letter-spacing:0.5px;">Recuperación de Acceso</p>
                  </td>
                </tr>

                <!-- Contenido -->
                <tr>
                  <td style="padding:24px 32px 32px;text-align:center;">
                    <p style="margin:0 0 20px;font-size:15px;color:#cbd5e1;line-height:1.5;">
                      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Ingresa el siguiente código de verificación:
                    </p>

                    <!-- Casillas OTP -->
                    <div style="margin:28px 0;">
                      <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                        <tr>
                          ${digitos.map((d) => `
                            <td style="padding:0 6px;">
                              <div style="width:52px;height:62px;line-height:62px;font-size:32px;font-weight:800;color:#e9b949;background:#0d182e;border:2px solid #2563eb;border-radius:10px;text-align:center;box-shadow:0 0 15px rgba(37,99,235,0.35);">
                                ${d}
                              </div>
                            </td>
                          `).join('')}
                        </tr>
                      </table>
                    </div>

                    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                      ⏱️ Este código expira en <strong style="color:#ffffff;">${dto.expiraEnMinutos} minutos</strong> y es de un solo uso.
                    </p>
                    <p style="margin:16px 0 0;font-size:12px;color:#64748b;line-height:1.4;">
                      Si tú no realizaste esta solicitud, puedes ignorar este correo de forma segura. Tu contraseña actual no cambiará.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#0d182e;padding:16px 24px;text-align:center;border-top:1px solid #1e293b;">
                    <p style="margin:0;font-size:11px;color:#64748b;">
                      &copy; ${new Date().getFullYear()} Warengine &mdash; Sistema de Seguridad y Gestión
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: this.from,
      to: dto.para,
      subject: '🔐 Tu código de recuperación de contraseña — Warengine',
      text: textoPlano,
      html,
    });
  }
}
