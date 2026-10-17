import { IMailer, EnviarEmailRecuperacionDto } from '@warengine/core';

export class PlatformMailer implements IMailer {
  constructor(private readonly frontendUrl: string = 'http://localhost:3000') {}

  public async enviarEmailRecuperacionPassword(
    dto: EnviarEmailRecuperacionDto,
  ): Promise<void> {
    const enlace = `${this.frontendUrl}/recuperar-password?token=${encodeURIComponent(dto.token)}`;
    console.log(
      `[PlatformMailer] Correo enviado a ${dto.para}: Enlace de recuperación: ${enlace} (vigencia: ${dto.expiraEnMinutos} min)`,
    );
    // Simulación de envío asíncrono
    await Promise.resolve();
  }
}
