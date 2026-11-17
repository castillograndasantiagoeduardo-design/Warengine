import { DomainError, Result } from '@warengine/shared-kernel';
import type { EstadoPedidoB2B } from '@warengine/contracts';
import { CotizacionB2B } from '../../domain/entities/CotizacionB2B.ts';
import {
  CotizacionEstadoInvalidoError,
  CotizacionNoEncontradaError,
  EstadoPedidoInvalidoError,
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

const TRANSICIONES_PERMITIDAS: Record<EstadoPedidoB2B, readonly EstadoPedidoB2B[]> = {
  en_proceso: ['despachado', 'entregado', 'cancelado'],
  despachado: ['entregado'],
  entregado: [],
  cancelado: [],
};

export interface ActualizarEstadoPedidoB2BRequest {
  cotizacionId: string;
  estadoPedido: EstadoPedidoB2B;
  actor: ActorAuditoria;
}

export type ActualizarEstadoPedidoB2BResponse = Result<CotizacionB2B, DomainError>;

export class ActualizarEstadoPedidoB2BUseCase {
  constructor(
    private readonly cotizacionRepository: ICotizacionB2BRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: ActualizarEstadoPedidoB2BRequest,
  ): Promise<ActualizarEstadoPedidoB2BResponse> {
    const cotizacion = await this.cotizacionRepository.findById(request.cotizacionId);
    if (!cotizacion) {
      return Result.fail(new CotizacionNoEncontradaError());
    }

    const alcanceRes = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceRes.isFailure) return Result.fail(alcanceRes.error);
    if (!alcanceRes.value.permite(cotizacion.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (cotizacion.estado !== 'facturada' || !cotizacion.estadoPedido) {
      return Result.fail(
        new CotizacionEstadoInvalidoError(
          'Solo se puede actualizar el estado del pedido en cotizaciones ya facturadas.',
        ),
      );
    }

    const permitidos = TRANSICIONES_PERMITIDAS[cotizacion.estadoPedido] ?? [];
    if (!permitidos.includes(request.estadoPedido)) {
      return Result.fail(
        new EstadoPedidoInvalidoError(
          `No se puede pasar un pedido de "${cotizacion.estadoPedido}" a "${request.estadoPedido}".`,
        ),
      );
    }

    const actualizada = await this.cotizacionRepository.actualizarEstadoPedido(
      cotizacion.id,
      request.estadoPedido,
    );
    if (!actualizada) {
      return Result.fail(new CotizacionNoEncontradaError());
    }

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.COTIZACIONES_B2B,
      entidadId: actualizada.id,
      detalles: {
        antes: { estadoPedido: cotizacion.estadoPedido },
        despues: { estadoPedido: actualizada.estadoPedido },
      },
    });

    return Result.ok(actualizada);
  }
}
