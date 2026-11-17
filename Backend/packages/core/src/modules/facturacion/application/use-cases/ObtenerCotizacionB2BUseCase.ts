import { DomainError, Result } from '@warengine/shared-kernel';
import { CotizacionB2B } from '../../domain/entities/CotizacionB2B.ts';
import { CotizacionNoEncontradaError } from '../../domain/errors/FacturacionErrors.ts';
import { ICotizacionB2BRepository } from '../../domain/repositories/ICotizacionB2BRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import type { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ObtenerCotizacionB2BRequest {
  cotizacionId: string;
  actor: ActorAuditoria;
}

export type ObtenerCotizacionB2BResponse = Result<CotizacionB2B, DomainError>;

export class ObtenerCotizacionB2BUseCase {
  constructor(
    private readonly cotizacionRepository: ICotizacionB2BRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ObtenerCotizacionB2BRequest): Promise<ObtenerCotizacionB2BResponse> {
    const cotizacion = await this.cotizacionRepository.findById(request.cotizacionId);
    if (!cotizacion) {
      return Result.fail(new CotizacionNoEncontradaError());
    }

    const alcanceRes = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceRes.isFailure) return Result.fail(alcanceRes.error);
    if (!alcanceRes.value.permite(cotizacion.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    return Result.ok(cotizacion);
  }
}
