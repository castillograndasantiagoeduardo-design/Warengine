import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IRolRepository } from '../../domain/repositories/IRolRepository.ts';
import { ISucursalesAutorizadasRepository } from '../../domain/repositories/ISucursalesAutorizadasRepository.ts';
import { AlcanceSucursal } from '../../domain/value-objects/AlcanceSucursal.ts';
import { TokenInvalidoError } from '../../domain/errors/AutenticacionErrors.ts';

/** Quien tenga este permiso opera sobre todas las sucursales (hoy solo el super-admin). */
export const PERMISO_ALCANCE_GLOBAL = 'administracion:ver-metricas-globales';

export interface ResolverAlcanceSucursalRequest {
  usuarioId: string;
}

export type ResolverAlcanceSucursalResponse = Result<AlcanceSucursal, DomainError>;

/**
 * RNF-ADM-04: determina sobre qué sucursales puede ver y modificar datos un usuario.
 * Se decide por PERMISO (no por nombre de rol) y se lee de la BD en cada llamada, de modo
 * que un cambio de asignación aplica de inmediato. Úsalo en cualquier caso de uso que
 * consulte o modifique datos de una sucursal.
 */
export class ResolverAlcanceSucursalUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly rolRepository: IRolRepository,
    private readonly sucursalesRepository: ISucursalesAutorizadasRepository,
  ) {}

  public async execute(
    request: ResolverAlcanceSucursalRequest,
  ): Promise<ResolverAlcanceSucursalResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new TokenInvalidoError('Usuario no encontrado.'));

    const permisos = await this.rolRepository.obtenerPermisosDeRol(usuario.rolId);
    if (permisos.includes(PERMISO_ALCANCE_GLOBAL)) return Result.ok(AlcanceSucursal.global());

    const ids = await this.sucursalesRepository.obtenerIdsAutorizados(usuario.id);
    return Result.ok(AlcanceSucursal.limitado(ids));
  }
}