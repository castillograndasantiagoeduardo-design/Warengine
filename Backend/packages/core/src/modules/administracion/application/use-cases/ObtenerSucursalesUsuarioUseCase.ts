import { Result, DomainError } from '@warengine/shared-kernel';
import { IGestionUsuarioRepository } from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { IUsuarioSucursalRepository } from '../../domain/repositories/IUsuarioSucursalRepository.ts';
import { UsuarioNoEncontradoError } from '../../domain/errors/AdministracionErrors.ts';

export interface ObtenerSucursalesUsuarioRequest {
  usuarioId: string;
}

export interface SucursalAsignada {
  id: number;
  nombre: string;
}

export interface SucursalesDeUsuario {
  usuarioId: string;
  principal: SucursalAsignada;
  adicionales: SucursalAsignada[];
  /** Principal + adicionales: todo lo que el usuario está autorizado a operar. */
  autorizadas: SucursalAsignada[];
}

export type ObtenerSucursalesUsuarioResponse = Result<SucursalesDeUsuario, DomainError>;

/** RF-ADM-C10: consulta las sucursales asignadas a un usuario. */
export class ObtenerSucursalesUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IGestionUsuarioRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly asignacionRepository: IUsuarioSucursalRepository,
  ) {}

  public async execute(
    request: ObtenerSucursalesUsuarioRequest,
  ): Promise<ObtenerSucursalesUsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new UsuarioNoEncontradoError());

    const idsAdicionales = await this.asignacionRepository.obtenerIdsAdicionales(usuario.id);
    const todas = await this.sucursalRepository.listar();

    const principal: SucursalAsignada = { id: usuario.sucursalId, nombre: usuario.sucursalNombre };
    const adicionales = todas
      .filter((s) => idsAdicionales.includes(s.id))
      .map((s) => ({ id: s.id, nombre: s.nombre }));

    return Result.ok({
      usuarioId: usuario.id,
      principal,
      adicionales,
      autorizadas: [principal, ...adicionales],
    });
  }
}