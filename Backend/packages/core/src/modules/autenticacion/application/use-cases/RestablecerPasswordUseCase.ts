import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordResetRepository } from '../../domain/repositories/IPasswordResetRepository.ts';
import { IPasswordService } from '../../domain/services/IPasswordService.ts';
import {
  TokenRecuperacionInvalidoError,
  PasswordsNoCoincidenError,
} from '../../domain/errors/AutenticacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface RestablecerPasswordRequest {
  token: string;
  nuevaPassword: string;
  confirmarPassword: string;
  ip?: string | null;
}

export interface RestablecerPasswordOutput {
  mensaje: string;
}

export type RestablecerPasswordResponse = Result<RestablecerPasswordOutput, DomainError>;

export class RestablecerPasswordUseCase {
  constructor(
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordService: IPasswordService,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: RestablecerPasswordRequest): Promise<RestablecerPasswordResponse> {
    const token = request.token?.trim();
    if (!token) {
      return Result.fail(new TokenRecuperacionInvalidoError());
    }

    if (request.nuevaPassword !== request.confirmarPassword) {
      return Result.fail(new PasswordsNoCoincidenError());
    }

    if (!request.nuevaPassword || request.nuevaPassword.length < 8) {
      return Result.fail(new PasswordsNoCoincidenError('La nueva contraseña debe tener al menos 8 caracteres.'));
    }

    // 1. Validar token existente, no usado y vigente (RF-SA-H4)
    const resetToken = await this.passwordResetRepository.buscarTokenValido(token);
    if (!resetToken || resetToken.usado || new Date() > resetToken.expiraEn) {
      return Result.fail(new TokenRecuperacionInvalidoError());
    }

    // 2. Localizar usuario
    const usuario = await this.usuarioRepository.findById(resetToken.usuarioId);
    if (!usuario || !usuario.isActive) {
      return Result.fail(new TokenRecuperacionInvalidoError());
    }

    // 3. Hashear nueva contraseña con Argon2id
    const nuevoPasswordHash = await this.passwordService.hashear(request.nuevaPassword);
    const ahora = new Date();

    // 4. Actualizar contraseña e invalidar tokens de sesión previos (RF-SA-D11 / RF-SA-H6)
    if (this.usuarioRepository.actualizarPassword) {
      await this.usuarioRepository.actualizarPassword(usuario.id, nuevoPasswordHash, ahora);
    }

    // 5. Invalidar token de recuperación usado (un solo uso, RF-SA-H4)
    await this.passwordResetRepository.marcarComoUsado(resetToken.id);

    // 6. Auditoría (Regla 5 de GEMINI.md: NUNCA auditar contraseñas ni hashes)
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
        motivo: 'Recuperación de contraseña vía enlace',
      },
    });

    return Result.ok({
      mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  }
}
