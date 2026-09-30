import { Result } from '../../../../../shared-kernel/mod.ts';
import { DomainError } from '../../../../../shared-kernel/mod.ts';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IRolRepository } from '../../domain/repositories/IRolRepository.ts';
import { ITokenService } from '../../domain/services/ITokenService.ts';
import { TokenInvalidoError, PermisoDenegadoError } from '../../domain/errors/AutenticacionErrors.ts';

export interface ValidarPermisoRequest {
  accessToken: string;
  permisoRequerido?: string; // ej. 'facturacion:facturar'
}

export type ValidarPermisoResponse = Result<void, DomainError>;

export class ValidarPermisoUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly rolRepository: IRolRepository
  ) {}

  public async execute(request: ValidarPermisoRequest): Promise<ValidarPermisoResponse> {
    try {
      const payload = await this.tokenService.validarAccessToken(request.accessToken);

      const usuario = await this.usuarioRepository.findById(payload.usuarioId);
      if (!usuario) {
        return Result.fail(new TokenInvalidoError('Usuario no encontrado.'));
      }

      if (usuario.credencialesFueronInvalidadas(payload.iat)) {
        return Result.fail(new TokenInvalidoError('Token revocado, inicie sesión de nuevo.'));
      }

      if (request.permisoRequerido) {
        const permisos = await this.rolRepository.obtenerPermisosDeRol(usuario.rolId);
        
        if (!permisos.includes(request.permisoRequerido)) {
          return Result.fail(new PermisoDenegadoError(request.permisoRequerido));
        }
      }

      return Result.ok();
    } catch (e) {
      return Result.fail(new TokenInvalidoError());
    }
  }
}
