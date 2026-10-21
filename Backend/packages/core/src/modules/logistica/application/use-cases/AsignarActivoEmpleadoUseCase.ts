import { Result, DomainError } from '@warengine/shared-kernel';
import { AsignacionActivo } from '../../domain/entities/AsignacionActivo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IAsignacionActivoRepository } from '../../domain/repositories/IAsignacionActivoRepository.ts';
import { IEmpleadoRepository } from '../../../administracion/domain/repositories/IEmpleadoRepository.ts';
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
import {
  EmpleadoNoEncontradoError,
  EmpleadoInactivoError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';

export interface AsignarActivoEmpleadoRequest {
  activoId: string;
  empleadoId: string;
  fechaDevolucionEsperada?: Date;
  observaciones?: string;
  actor: ActorAuditoria;
}

export type AsignarActivoEmpleadoResponse = Result<AsignacionActivo, DomainError>;

export class AsignarActivoEmpleadoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly asignacionRepository: IAsignacionActivoRepository,
    private readonly empleadoRepository: IEmpleadoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: AsignarActivoEmpleadoRequest): Promise<AsignarActivoEmpleadoResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    // Alcance
    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (activo.estaDeBaja) return Result.fail(new ActivoDeBajaError());
    if (!activo.estaDisponible) return Result.fail(new ActivoNoDisponibleError());

    // Validar empleado
    const empleado = await this.empleadoRepository.findById(request.empleadoId);
    if (!empleado) return Result.fail(new EmpleadoNoEncontradoError());
    if (!empleado.isActive) return Result.fail(new EmpleadoInactivoError());
    if (empleado.sucursalId !== activo.sucursalId) {
      return Result.fail(new ResponsableFueraDeSucursalError());
    }

    const asignacion = await this.asignacionRepository.crear({
      activoId: activo.id,
      empleadoId: request.empleadoId,
      areaId: null,
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
          empleadoId: asignacion.empleadoId,
          sucursalId: asignacion.sucursalId,
        },
      },
    });

    return Result.ok(asignacion);
  }
}
