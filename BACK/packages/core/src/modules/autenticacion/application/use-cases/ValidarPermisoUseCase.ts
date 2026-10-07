import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IRolRepository } from '../../domain/repositories/IRolRepository.ts';
import { ITokenService } from '../../domain/services/ITokenService.ts';
import {
  TokenInvalidoError,
  PermisoDenegadoError,
  UsuarioInactivoError,
} from '../../domain/errors/AutenticacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ValidarPermisoRequest {
  accessToken: string;
  permisoRequerido?: string; // ej. 'facturacion:facturar'
  ip?: string | null;
  metodo?: string;
  ruta?: string;
}

/**
 * Identidad del usuario ya verificada (firma, vigencia, estado y revocación).
 * Los controladores la usan para saber QUIÉN ejecuta la operación (auditoría, alcance).
 */
export interface IdentidadAutenticada {
  usuarioId: string;
  rolId: number;
}

export type ValidarPermisoResponse = Result<IdentidadAutenticada, DomainError>;

export class ValidarPermisoUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly rolRepository: IRolRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: ValidarPermisoRequest): Promise<ValidarPermisoResponse> {
    try {
      const payload = await this.tokenService.validarAccessToken(request.accessToken);

      const usuario = await this.usuarioRepository.findById(payload.usuarioId);
      if (!usuario) {
        // Decisión consciente: Tokens inválidos o con usuario inexistente no se auditan en logs_auditoria
        // porque no hay un usuario identificado verificado en el sistema.
        return Result.fail(new TokenInvalidoError('Usuario no encontrado.'));
      }

      if (!usuario.isActive) {
        return Result.fail(new UsuarioInactivoError());
      }

      if (usuario.credencialesFueronInvalidadas(payload.iat)) {
        return Result.fail(new TokenInvalidoError('Token revocado, inicie sesión de nuevo.'));
      }

      if (request.permisoRequerido) {
        const permisos = await this.rolRepository.obtenerPermisosDeRol(usuario.rolId);

        if (!permisos.includes(request.permisoRequerido)) {
          // RF-ADM-C11: Auditoría de acceso denegado cuando el usuario autenticado carece del permiso requerido
          await this.auditor.registrar({
            actor: {
              usuarioId: usuario.id,
              ip: request.ip ?? null,
            },
            accion: ACCIONES_AUDITORIA.ACCESO_DENEGADO,
            entidad: ENTIDADES_AUDITORIA.ACCESO,
            entidadId: null,
            detalles: {
              permisoRequerido: request.permisoRequerido,
              metodo: request.metodo ?? null,
              ruta: request.ruta ?? null,
            },
          });

          return Result.fail(new PermisoDenegadoError(request.permisoRequerido));
        }
      }

      return Result.ok({ usuarioId: usuario.id, rolId: usuario.rolId });
    } catch (_e) {
      // Decisión consciente: Errores criptográficos de token (firma corrupta, expirado)
      // no generan logs_auditoria al carecer de usuario confiable.
      return Result.fail(new TokenInvalidoError());
    }
  }
}