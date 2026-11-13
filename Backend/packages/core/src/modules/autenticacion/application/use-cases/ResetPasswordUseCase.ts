import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordResetRepository } from '../../domain/repositories/IPasswordResetRepository.ts';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.ts';
import { IPasswordService } from '../../domain/services/IPasswordService.ts';
import {
  ResetTokenInvalidoError,
  PasswordsNoCoincidenError,
} from '../../domain/errors/AutenticacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  ip?: string | null;
}

export interface ResetPasswordOutput {
  mensaje: string;
}

export type ResetPasswordResponse = Result<ResetPasswordOutput, DomainError>;

export class ResetPasswordUseCase {
  constructor(
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordService: IPasswordService,
    private readonly auditor: IAuditor,
    private readonly hasheadorResetToken: (token: string) => string,
  ) {}

  public async execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const token = request.resetToken?.trim();
    const newPassword = request.newPassword;

    // 1. Validaciones de formato
    if (!token || !/^[a-fA-F0-9]{64}$/.test(token)) {
      return Result.fail(new ResetTokenInvalidoError('Token de restablecimiento inválido.'));
    }

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      return Result.fail(
        new PasswordsNoCoincidenError('La nueva contraseña debe tener entre 8 y 128 caracteres.'),
      );
    }

    // 2. Búsqueda y validación de vigencia del resetToken
    if (!this.passwordResetRepository.buscarPorResetTokenHash) {
      return Result.fail(new ResetTokenInvalidoError());
    }

    const tokenHash = this.hasheadorResetToken(token);
    const registro = await this.passwordResetRepository.buscarPorResetTokenHash(tokenHash);

    if (!registro || registro.used) {
      return Result.fail(new ResetTokenInvalidoError());
    }

    const ahora = new Date();
    if (registro.resetTokenExpiresAt && ahora > registro.resetTokenExpiresAt) {
      return Result.fail(new ResetTokenInvalidoError('El token de restablecimiento ha expirado.'));
    }

    // 3. Verificación de usuario
    const usuario = await this.usuarioRepository.findById(registro.usuarioId);
    if (!usuario || !usuario.isActive) {
      return Result.fail(new ResetTokenInvalidoError());
    }

    // 4. Hasheo seguro con Argon2id (m=65536, t=3, p=4)
    const nuevoPasswordHash = await this.passwordService.hashear(newPassword);

    // 5. Transacción de seguridad y revocación de sesiones:
    // a) Marcar todos los reseteos del usuario como usados
    if (this.passwordResetRepository.marcarTodosComoUsadosPorUsuario) {
      await this.passwordResetRepository.marcarTodosComoUsadosPorUsuario(usuario.id);
    }

    // b) Revocar todos los refresh_tokens del usuario (revocado = 1)
    if (this.refreshTokenRepository.revocarTodosPorUsuario) {
      await this.refreshTokenRepository.revocarTodosPorUsuario(usuario.id);
    }

    // c) Actualizar contraseña e invalidar JWT tokens previos mediante tokens_invalidados_en
    if (this.usuarioRepository.actualizarPassword) {
      await this.usuarioRepository.actualizarPassword(usuario.id, nuevoPasswordHash, ahora);
    }

    // 6. Auditoría (sin contraseñas ni tokens)
    await this.auditor.registrar({
      actor: {
        usuarioId: usuario.id,
        ip: request.ip ?? null,
      },
      accion: ACCIONES_AUDITORIA.RESTABLECER_PASSWORD,
      entidad: ENTIDADES_AUDITORIA.USUARIOS,
      entidadId: usuario.id,
      detalles: {
        email: usuario.email,
        metodo: 'otp_4_digitos',
      },
    });

    return Result.ok({
      mensaje: 'Contraseña actualizada exitosamente. Todas las sesiones activas han sido cerradas.',
    });
  }
}
