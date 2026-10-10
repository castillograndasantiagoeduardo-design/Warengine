import { Result, DomainError } from '@warengine/shared-kernel';
import { IGestionUsuarioRepository } from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { IUsuarioSucursalRepository } from '../../domain/repositories/IUsuarioSucursalRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
  UsuarioNoEncontradoError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface AsignarSucursalesUsuarioRequest {
  usuarioId: string;
  sucursalPrincipalId: number;
  sucursalesAdicionalesIds: number[];
  actor: ActorAuditoria;
}

export interface AsignacionSucursales {
  usuarioId: string;
  sucursalPrincipalId: number;
  sucursalesAdicionalesIds: number[];
}

export type AsignarSucursalesUsuarioResponse = Result<AsignacionSucursales, DomainError>;

function mismoConjunto(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((valor, i) => valor === b[i]);
}

/**
 * RF-ADM-C10: el Super Admin asigna a un usuario una sucursal principal y, opcionalmente,
 * otras sucursales adicionales. Reemplaza la asignación anterior completa.
 */
export class AsignarSucursalesUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IGestionUsuarioRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly asignacionRepository: IUsuarioSucursalRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: AsignarSucursalesUsuarioRequest,
  ): Promise<AsignarSucursalesUsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new UsuarioNoEncontradoError());

    const principal = request.sucursalPrincipalId;
    // Sin repetidos, sin la principal (ya está autorizada) y ordenadas.
    const adicionales = [...new Set(request.sucursalesAdicionalesIds)]
      .filter((id) => id !== principal)
      .sort((a, b) => a - b);
    const actuales = [...(await this.asignacionRepository.obtenerIdsAdicionales(usuario.id))]
      .sort((a, b) => a - b);

    const cambiaPrincipal = principal !== usuario.sucursalId;
    const cambianAdicionales = !mismoConjunto(actuales, adicionales);

    const resultado: AsignacionSucursales = {
      usuarioId: usuario.id,
      sucursalPrincipalId: principal,
      sucursalesAdicionalesIds: adicionales,
    };

    // Sin cambios: no se tocan los tokens del usuario ni se ensucia la auditoría.
    if (!cambiaPrincipal && !cambianAdicionales) return Result.ok(resultado);

    // Solo las sucursales NUEVAS deben existir y estar activas; conservar una que ya tenía
    // (aunque luego se haya inactivado) no debe bloquear el guardado.
    const nuevas = [
      ...(cambiaPrincipal ? [principal] : []),
      ...adicionales.filter((id) => !actuales.includes(id)),
    ];
    for (const id of nuevas) {
      const sucursal = await this.sucursalRepository.findById(id);
      if (!sucursal) return Result.fail(new SucursalNoEncontradaError());
      if (!sucursal.isActive) return Result.fail(new SucursalInactivaError());
    }

    await this.asignacionRepository.reemplazarSucursales(
      usuario.id,
      principal,
      adicionales,
      new Date(),
    );

    // Convención ADR 0002: solo los atributos que cambiaron.
    const antes: Record<string, unknown> = {};
    const despues: Record<string, unknown> = {};
    if (cambiaPrincipal) {
      antes.sucursalPrincipalId = usuario.sucursalId;
      despues.sucursalPrincipalId = principal;
    }
    if (cambianAdicionales) {
      antes.sucursalesAdicionalesIds = actuales;
      despues.sucursalesAdicionalesIds = adicionales;
    }
    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.USUARIOS,
      entidadId: usuario.id,
      detalles: { antes, despues },
    });

    return Result.ok(resultado);
  }
}