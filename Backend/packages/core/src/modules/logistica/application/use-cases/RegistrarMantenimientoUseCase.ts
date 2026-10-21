import { Result, DomainError } from '@warengine/shared-kernel';
import { MantenimientoActivo } from '../../domain/entities/MantenimientoActivo.ts';
import { ESTADOS_ACTIVO } from '../../domain/entities/Activo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IMantenimientoActivoRepository } from '../../domain/repositories/IMantenimientoActivoRepository.ts';
import { IProveedorRepository } from '../../../inventario/domain/repositories/IProveedorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  ActivoNoEncontradoError,
  ActivoDeBajaError,
  ActivoNoPermiteMantenimientoError,
} from '../../domain/errors/LogisticaErrors.ts';
import {
  ProveedorNoEncontradoError,
  ProveedorInactivoError,
} from '../../../inventario/domain/errors/InventarioErrors.ts';
import { TipoMantenimiento } from '../../domain/entities/MantenimientoActivo.ts';

export interface RegistrarMantenimientoRequest {
  activoId: string;
  tipo: TipoMantenimiento;
  proveedorId?: number;
  fecha?: string;
  costo?: number;
  descripcion?: string;
  actor: ActorAuditoria;
}

export type RegistrarMantenimientoResponse = Result<MantenimientoActivo, DomainError>;

export class RegistrarMantenimientoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly mantenimientoRepository: IMantenimientoActivoRepository,
    private readonly proveedorRepository: IProveedorRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: RegistrarMantenimientoRequest): Promise<RegistrarMantenimientoResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (activo.estaDeBaja) return Result.fail(new ActivoDeBajaError());
    if (activo.estado === ESTADOS_ACTIVO.ASIGNADO || activo.estado === ESTADOS_ACTIVO.MANTENIMIENTO) {
      return Result.fail(new ActivoNoPermiteMantenimientoError(activo.estado));
    }

    // Validar proveedor si viene
    if (request.proveedorId !== undefined) {
      const proveedor = await this.proveedorRepository.findById(request.proveedorId);
      if (!proveedor) return Result.fail(new ProveedorNoEncontradoError());
      if (!proveedor.isActive) return Result.fail(new ProveedorInactivoError());
    }

    const mantenimiento = await this.mantenimientoRepository.crear({
      activoId: activo.id,
      proveedorId: request.proveedorId ?? null,
      tipo: request.tipo,
      fecha: request.fecha ?? null,
      costo: request.costo ?? null,
      descripcion: request.descripcion ?? null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.MANTENIMIENTOS_ACTIVOS,
      entidadId: mantenimiento.id,
      detalles: {
        despues: {
          activoId: mantenimiento.activoId,
          tipo: mantenimiento.tipo,
          proveedorId: mantenimiento.proveedorId,
          fecha: mantenimiento.fecha,
          costo: mantenimiento.costo,
        },
      },
    });

    return Result.ok(mantenimiento);
  }
}
