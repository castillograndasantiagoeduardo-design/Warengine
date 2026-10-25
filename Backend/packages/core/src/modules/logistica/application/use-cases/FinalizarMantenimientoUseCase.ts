import { Result, DomainError } from '@warengine/shared-kernel';
import { MantenimientoActivo } from '../../domain/entities/MantenimientoActivo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IMantenimientoActivoRepository } from '../../domain/repositories/IMantenimientoActivoRepository.ts';
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
  MantenimientoNoEncontradoError,
  MantenimientoYaFinalizadoError,
  FechaFinAnteriorAInicioError,
} from '../../domain/errors/LogisticaErrors.ts';

export interface FinalizarMantenimientoRequest {
  mantenimientoId: string;
  fechaFin?: string;
  costo?: number;
  descripcion?: string;
  actor: ActorAuditoria;
}

export type FinalizarMantenimientoResponse = Result<MantenimientoActivo, DomainError>;

export class FinalizarMantenimientoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly mantenimientoRepository: IMantenimientoActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: FinalizarMantenimientoRequest): Promise<FinalizarMantenimientoResponse> {
    const mantenimiento = await this.mantenimientoRepository.findById(request.mantenimientoId);
    if (!mantenimiento) return Result.fail(new MantenimientoNoEncontradoError());

    if (!mantenimiento.enCurso) {
      return Result.fail(new MantenimientoYaFinalizadoError());
    }

    const activo = await this.activoRepository.findById(mantenimiento.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    const hoy = new Date().toISOString().split('T')[0];
    const fechaFin = request.fechaFin ?? hoy;

    if (fechaFin < mantenimiento.fecha) {
      return Result.fail(new FechaFinAnteriorAInicioError());
    }

    const finalizado = await this.mantenimientoRepository.finalizar(mantenimiento.id, {
      fechaFin,
      costo: request.costo,
      descripcion: request.descripcion,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.MANTENIMIENTOS_ACTIVOS,
      entidadId: mantenimiento.id,
      detalles: {
        antes: { fechaFin: null, costo: mantenimiento.costo },
        despues: { fechaFin: finalizado.fechaFin, costo: finalizado.costo },
      },
    });

    return Result.ok(finalizado);
  }
}
