import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordResetRepository } from '../../domain/repositories/IPasswordResetRepository.ts';
import { IOtpMailer } from '../../domain/services/IMailer.ts';
import { ReenvioOtpEnCooldownError } from '../../domain/errors/AutenticacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ForgotPasswordRequest {
  email: string;
  ip?: string | null;
}

export interface ForgotPasswordOutput {
  mensaje: string;
}

export type ForgotPasswordResponse = Result<ForgotPasswordOutput, DomainError>;

export class ForgotPasswordUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly otpMailer: IOtpMailer,
    private readonly auditor: IAuditor,
    private readonly generadorOtp: () => string,
    private readonly hasheadorOtp: (codigo: string, email: string) => string,
  ) {}

  public async execute(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const emailNormalizado = request.email.trim().toLowerCase();
    const mensajeGenerico =
      'Si el correo electrónico se encuentra registrado en el sistema, recibirás un código de 4 dígitos para restablecer tu contraseña.';

    // 1. Anti-enumeración: Buscar usuario; si no existe o no está activo, responder éxito idéntico
    const usuario = await this.usuarioRepository.findByEmail(emailNormalizado);
    if (!usuario || !usuario.isActive) {
      return Result.ok({ mensaje: mensajeGenerico });
    }

    // 2. Control de Reenvío (Cooldown mínimo de 60 segundos entre solicitudes)
    const ultima = this.passwordResetRepository.obtenerUltimaSolicitudPorEmail
      ? await this.passwordResetRepository.obtenerUltimaSolicitudPorEmail(emailNormalizado)
      : null;

    if (ultima && !ultima.used) {
      const tiempoTranscurridoMs = Date.now() - ultima.createdAt.getTime();
      const cooldownMs = 60 * 1000;
      if (tiempoTranscurridoMs < cooldownMs) {
        const segundosRestantes = Math.ceil((cooldownMs - tiempoTranscurridoMs) / 1000);
        return Result.fail(new 
          ReenvioOtpEnCooldownError(segundosRestantes));
      }
    }

    // 3. Generar código OTP criptoseguro de 4 dígitos (0000-9999) y su HMAC-SHA256
    const codigoOtp = this.generadorOtp();
    const codeHash = this.hasheadorOtp(codigoOtp, emailNormalizado);

    // 4. Vigencia de 10 minutos
    const expiraEnMinutos = 10;
    const expiresAt = new Date(Date.now() + expiraEnMinutos * 60 * 1000);

    // 5. Persistencia (invalida solicitudes activas previas e inserta con attempts = 0)
    if (this.passwordResetRepository.guardarOtp) {
      await this.passwordResetRepository.guardarOtp(
        usuario.id,
        emailNormalizado,
        codeHash,
        expiresAt,
      );
    }

    // 6. Envío de correo electrónico seguro
    await this.otpMailer.enviarCodigoOtp({
      para: usuario.email,
      codigoOtp,
      expiraEnMinutos,
    });

    // 7. Registro de auditoría (NUNCA registrar el código OTP en texto claro ni hashes)
    await this.auditor.registrar({
      actor: {
        usuarioId: usuario.id,
        ip: request.ip ?? null,
      },
      accion: ACCIONES_AUDITORIA.SOLICITAR_RECUPERACION_PASSWORD,
      entidad: ENTIDADES_AUDITORIA.USUARIOS,
      entidadId: usuario.id,
      detalles: {
        email: usuario.email,
        canal: 'email_otp_4_digitos',
      },
    });

    return Result.ok({ mensaje: mensajeGenerico });
  }
}
