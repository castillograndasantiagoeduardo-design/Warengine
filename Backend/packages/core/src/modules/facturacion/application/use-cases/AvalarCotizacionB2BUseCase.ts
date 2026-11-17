import { DomainError, Result } from '@warengine/shared-kernel';
import { CotizacionB2B } from '../../domain/entities/CotizacionB2B.ts';
import {
  CotizacionEstadoInvalidoError,
  CotizacionNoEncontradaError,
  CotizacionVencidaError,
} from '../../domain/errors/FacturacionErrors.ts';
import { ICotizacionB2BRepository } from '../../domain/repositories/ICotizacionB2BRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface AvalarCotizacionB2BRequest {
  cotizacionId: string;
  accion: 'avalar' | 'rechazar';
  motivoRechazo?: string;
  actor: ActorAuditoria;
}

export type AvalarCotizacionB2BResponse = Result<CotizacionB2B, DomainError>;

/**
 * Permite al Administrador de Sucursal (o Super Admin) dar aval o rechazar una cotización B2B.
 *
 * - Si se avala: cambia el estado a `aprobada` habilitando su facturación (Modo A).
 * - Si se rechaza: exige `motivoRechazo` y cambia el estado a `rechazada`.
 */
export class AvalarCotizacionB2BUseCase {
  constructor(
    private readonly cotizacionRepository: ICotizacionB2BRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: AvalarCotizacionB2BRequest): Promise<AvalarCotizacionB2BResponse> {
    const cotizacion = await this.cotizacionRepository.findById(request.cotizacionId);
    if (!cotizacion) {
      return Result.fail(new CotizacionNoEncontradaError());
    }

    const alcanceRes = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceRes.isFailure) return Result.fail(alcanceRes.error);
    if (!alcanceRes.value.permite(cotizacion.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (cotizacion.estado !== 'pendiente_aval') {
      return Result.fail(
        new CotizacionEstadoInvalidoError(
          `Solo se pueden evaluar cotizaciones en estado pendiente_aval (estado actual: ${cotizacion.estado}).`,
        ),
      );
    }

    const ahora = new Date();
    if (request.accion === 'avalar' && cotizacion.estaVencida(ahora)) {
      return Result.fail(new CotizacionVencidaError());
    }

    if (
      request.accion === 'rechazar' &&
      (!request.motivoRechazo || request.motivoRechazo.trim().length < 5)
    ) {
      return Result.fail(
        new CotizacionEstadoInvalidoError('El motivo de rechazo debe tener al menos 5 caracteres.'),
      );
    }

    const actualizada =
      request.accion === 'avalar'
        ? await this.cotizacionRepository.otorgarAval(cotizacion.id, request.actor.usuarioId, ahora)
        : await this.cotizacionRepository.rechazar(
            cotizacion.id,
            request.actor.usuarioId,
            ahora,
            request.motivoRechazo!.trim(),
          );

    if (!actualizada) {
      return Result.fail(
        new CotizacionEstadoInvalidoError('La cotización ya fue evaluada por otro administrador.'),
      );
    }

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.COTIZACIONES_B2B,
      entidadId: actualizada.id,
      detalles: {
        antes: { estado: cotizacion.estado },
        despues: {
          estado: actualizada.estado,
          aprobadoPor: actualizada.aprobadoPor,
          motivoRechazo: actualizada.motivoRechazo,
        },
      },
    });

    return Result.ok(actualizada);
  }
}
