import { DomainError, Result } from '@warengine/shared-kernel';
import { CotizacionB2B } from '../../domain/entities/CotizacionB2B.ts';
import { Factura } from '../../domain/entities/Factura.ts';
import type { MedioPago } from '../../domain/entities/FacturaPago.ts';
import {
  CotizacionEstadoInvalidoError,
  CotizacionNoEncontradaError,
  CotizacionSinAvalError,
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
import { CrearFacturaUseCase } from './CrearFacturaUseCase.ts';

export interface FacturarCotizacionB2BRequest {
  cotizacionId: string;
  medioPago?: MedioPago;
  referenciaTransaccion?: string | null;
  actor: ActorAuditoria;
}

export interface FacturarCotizacionB2BResultado {
  cotizacion: CotizacionB2B;
  factura: Factura;
}

export type FacturarCotizacionB2BResponse = Result<FacturarCotizacionB2BResultado, DomainError>;

/**
 * Modo A (2 pasos): convierte una cotización B2B PREVIAMENTE AVALADA por el Admin de Sucursal
 * en una factura emitida (descontando Kardex y cupo de crédito) y la pasa a `pedido en_proceso`.
 */
export class FacturarCotizacionB2BUseCase {
  constructor(
    private readonly cotizacionRepository: ICotizacionB2BRepository,
    private readonly crearFacturaUseCase: CrearFacturaUseCase,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: FacturarCotizacionB2BRequest,
  ): Promise<FacturarCotizacionB2BResponse> {
    const cotizacion = await this.cotizacionRepository.findById(request.cotizacionId);
    if (!cotizacion) {
      return Result.fail(new CotizacionNoEncontradaError());
    }

    const alcanceRes = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceRes.isFailure) return Result.fail(alcanceRes.error);
    if (!alcanceRes.value.permite(cotizacion.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (cotizacion.estado === 'pendiente_aval' || cotizacion.estado === 'borrador') {
      return Result.fail(new CotizacionSinAvalError());
    }

    if (cotizacion.estado !== 'aprobada' || cotizacion.facturaId !== null) {
      return Result.fail(
        new CotizacionEstadoInvalidoError(
          `Solo se pueden facturar cotizaciones aprobadas sin factura previa (estado actual: ${cotizacion.estado}).`,
        ),
      );
    }

    if (cotizacion.estaVencida(new Date())) {
      return Result.fail(new CotizacionVencidaError());
    }

    const medioPago = request.medioPago ?? cotizacion.medioPagoSugerido;
    const referencia = request.referenciaTransaccion ?? cotizacion.referenciaPago ?? null;

    const facturaRes = await this.crearFacturaUseCase.execute({
      clienteId: cotizacion.clienteId,
      esB2B: true,
      items: cotizacion.items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento,
      })),
      pagos: [
        {
          medioPago,
          monto: cotizacion.total,
          referenciaTransaccion: referencia,
        },
      ],
      actor: request.actor,
    });

    if (facturaRes.isFailure) {
      return Result.fail(facturaRes.error);
    }

    const factura = facturaRes.value;
    const cotizacionFacturada = await this.cotizacionRepository.marcarFacturadaYEnProceso(
      cotizacion.id,
      factura.id,
    );

    if (!cotizacionFacturada) {
      return Result.fail(
        new CotizacionEstadoInvalidoError('La cotización ya fue facturada simultáneamente.'),
      );
    }

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.COTIZACIONES_B2B,
      entidadId: cotizacionFacturada.id,
      detalles: {
        antes: { estado: cotizacion.estado, estadoPedido: cotizacion.estadoPedido },
        despues: {
          estado: cotizacionFacturada.estado,
          estadoPedido: cotizacionFacturada.estadoPedido,
          facturaId: factura.id,
        },
      },
    });

    return Result.ok({
      cotizacion: cotizacionFacturada,
      factura,
    });
  }
}
