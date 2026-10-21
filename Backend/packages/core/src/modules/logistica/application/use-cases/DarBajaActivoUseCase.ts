import { Result, DomainError } from '@warengine/shared-kernel';
import { Activo, ESTADOS_ACTIVO } from '../../domain/entities/Activo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
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
  ActivoNoPuedeDarseDeBajaError,
} from '../../domain/errors/LogisticaErrors.ts';

export interface DarBajaActivoRequest {
  activoId: string;
  motivo: string;
  actor: ActorAuditoria;
}

export type DarBajaActivoResponse = Result<Activo, DomainError>;

export class DarBajaActivoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: DarBajaActivoRequest): Promise<DarBajaActivoResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) {
      return Result.fail(new ActivoNoEncontradoError());
    }

    // Alcance
    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (activo.estaDeBaja) {
      return Result.fail(new ActivoDeBajaError());
    }
    if (activo.estado === ESTADOS_ACTIVO.ASIGNADO || activo.estado === ESTADOS_ACTIVO.MANTENIMIENTO) {
      return Result.fail(new ActivoNoPuedeDarseDeBajaError(activo.estado));
    }

    const activoBaja = await this.activoRepository.marcarBaja(activo.id);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.INACTIVAR,
      entidad: ENTIDADES_AUDITORIA.ACTIVOS,
      entidadId: activo.id,
      detalles: {
        antes: { estado: activo.estado },
        despues: { estado: activoBaja.estado, motivo: request.motivo },
      },
    });

    return Result.ok(activoBaja);
  }
}
