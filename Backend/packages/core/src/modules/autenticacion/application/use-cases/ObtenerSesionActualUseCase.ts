import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IRolRepository } from '../../domain/repositories/IRolRepository.ts';
import { IPerfilSesionRepository } from '../../domain/repositories/IPerfilSesionRepository.ts';
import { TokenInvalidoError } from '../../domain/errors/AutenticacionErrors.ts';
import { construirUsuarioSesion, UsuarioSesion } from './LoginUseCase.ts';

export interface ObtenerSesionActualRequest {
  /** Usuario ya autenticado por authMiddleware (token válido y no revocado). */
  usuarioId: string;
}

export type ObtenerSesionActualResponse = Result<
  { usuario: UsuarioSesion; permisos: string[] },
  DomainError
>;

/**
 * RF-SA-D5: rehidrata la sesión del frontend (GET /auth/verificar) con la misma forma
 * que devuelve el login, incluida la sede del usuario. Solo lectura: no audita.
 */
export class ObtenerSesionActualUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly rolRepository: IRolRepository,
    private readonly perfilSesionRepository: IPerfilSesionRepository,
  ) {}

  public async execute(request: ObtenerSesionActualRequest): Promise<ObtenerSesionActualResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new TokenInvalidoError('Usuario no encontrado.'));

    return Result.ok(
      await construirUsuarioSesion(usuario, this.rolRepository, this.perfilSesionRepository),
    );
  }
}
