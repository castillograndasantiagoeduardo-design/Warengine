import { Result, DomainError } from '@warengine/shared-kernel';
import { AsignacionActivo } from '../../domain/entities/AsignacionActivo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IAsignacionActivoRepository } from '../../domain/repositories/IAsignacionActivoRepository.ts';
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
  AsignacionNoEncontradaError,
} from '../../domain/errors/LogisticaErrors.ts';

export interface DevolverActivoRequest {
  activoId: string;
  observaciones?: string;
  actor: ActorAuditoria;
}

export type DevolverActivoResponse = Result<AsignacionActivo, DomainError>;

export class DevolverActivoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly asignacionRepository: IAsignacionActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: DevolverActivoRequest): Promise<DevolverActivoResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    const asignacionVigente = await this.asignacionRepository.findActivaPorActivo(request.activoId);
    if (!asignacionVigente) {
      return Result.fail(new AsignacionNoEncontradaError());
    }

    const devuelta = await this.asignacionRepository.registrarDevolucion(
      asignacionVigente.id,
      new Date(),
      request.observaciones ?? null,
    );

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.ASIGNACIONES_ACTIVOS,
      entidadId: devuelta.id,
      detalles: {
        antes: { estado: asignacionVigente.estado, fechaDevolucionReal: null },
        despues: { estado: devuelta.estado, fechaDevolucionReal: devuelta.fechaDevolucionReal?.toISOString() },
      },
    });

    return Result.ok(devuelta);
  }
}
