import { Result, DomainError } from '@warengine/shared-kernel';
import { AsignacionActivo } from '../../domain/entities/AsignacionActivo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IAsignacionActivoRepository } from '../../domain/repositories/IAsignacionActivoRepository.ts';
import { IAreaRepository } from '../../../administracion/domain/repositories/IAreaRepository.ts';
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
  ActivoNoDisponibleError,
  ResponsableFueraDeSucursalError,
} from '../../domain/errors/LogisticaErrors.ts';
import { AreaNoEncontradaError } from '../../../administracion/domain/errors/AdministracionErrors.ts';

export interface AsignarActivoAreaRequest {
  activoId: string;
  areaId: number;
  fechaDevolucionEsperada?: Date;
  observaciones?: string;
  actor: ActorAuditoria;
}

export type AsignarActivoAreaResponse = Result<AsignacionActivo, DomainError>;

export class AsignarActivoAreaUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly asignacionRepository: IAsignacionActivoRepository,
    private readonly areaRepository: IAreaRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: AsignarActivoAreaRequest): Promise<AsignarActivoAreaResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (activo.estaDeBaja) return Result.fail(new ActivoDeBajaError());
    if (!activo.estaDisponible) return Result.fail(new ActivoNoDisponibleError());

    // Validar area
    const area = await this.areaRepository.findById(request.areaId);
    if (!area) return Result.fail(new AreaNoEncontradaError());
    if (area.sucursalId !== activo.sucursalId) {
      return Result.fail(new ResponsableFueraDeSucursalError());
    }

    const asignacion = await this.asignacionRepository.crear({
      activoId: activo.id,
      empleadoId: null,
      areaId: request.areaId,
      sucursalId: activo.sucursalId,
      asignadoPor: request.actor.usuarioId,
      fechaDevolucionEsperada: request.fechaDevolucionEsperada ?? null,
      observaciones: request.observaciones ?? null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.ASIGNACIONES_ACTIVOS,
      entidadId: asignacion.id,
      detalles: {
        despues: {
          activoId: asignacion.activoId,
          areaId: asignacion.areaId,
          sucursalId: asignacion.sucursalId,
        },
      },
    });

    return Result.ok(asignacion);
  }
}
