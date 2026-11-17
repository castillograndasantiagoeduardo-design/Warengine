import { DomainError, Result } from '@warengine/shared-kernel';
import { CotizacionB2B, CotizacionB2BItem } from '../../domain/entities/CotizacionB2B.ts';
import type { MedioPago } from '../../domain/entities/FacturaPago.ts';
import {
  ClienteNoEncontradoError,
  ClienteRequeridoParaVentaB2BError,
  PagoInvalidoError,
} from '../../domain/errors/FacturacionErrors.ts';
import { OperadorSinSucursalError } from '../../domain/errors/TurnoCajaErrors.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import { ICotizacionB2BRepository } from '../../domain/repositories/ICotizacionB2BRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { IAlertaAdminRepository } from '../../../administracion/domain/repositories/IAlertaAdminRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ItemCotizacionRequest {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export interface CrearCotizacionB2BRequest {
  clienteId: string;
  items: ItemCotizacionRequest[];
  medioPagoSugerido?: MedioPago;
  referenciaPago?: string | null;
  diasVigencia?: number;
  observaciones?: string | null;
  actor: ActorAuditoria;
}

export type CrearCotizacionB2BResponse = Result<CotizacionB2B, DomainError>;

/**
 * Crea una cotización comercial B2B en estado `pendiente_aval`.
 *
 * REGLAS DE NEGOCIO:
 * - El Vendedor B2B cotiza sin descontar inventario (no mueve Kardex).
 * - La cotización queda pendiente de aval por el Administrador de Sucursal.
 * - Se notifica al Administrador de Sucursal mediante `alertas_admin`.
 */
export class CrearCotizacionB2BUseCase {
  constructor(
    private readonly cotizacionRepository: ICotizacionB2BRepository,
    private readonly clienteRepository: IClienteRepository,
    private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
    private readonly auditor: IAuditor,
    private readonly alertaAdminRepository?: IAlertaAdminRepository,
  ) {}

  public async execute(request: CrearCotizacionB2BRequest): Promise<CrearCotizacionB2BResponse> {
    if (!request.items || request.items.length === 0) {
      return Result.fail(
        new PagoInvalidoError('La cotización B2B debe incluir al menos un producto.'),
      );
    }

    const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(
      request.actor.usuarioId,
    );
    if (sucursalId === null) {
      return Result.fail(new OperadorSinSucursalError());
    }

    const cliente = await this.clienteRepository.findById(request.clienteId);
    if (!cliente) {
      return Result.fail(new ClienteNoEncontradoError());
    }
    if (!cliente.esB2B) {
      return Result.fail(new ClienteRequeridoParaVentaB2BError());
    }

    const { subtotal, iva, total } = CotizacionB2B.calcularTotales(request.items);
    const cotizacionId = crypto.randomUUID();
    const ahora = new Date();
    const diasVigencia = Math.min(30, Math.max(1, request.diasVigencia ?? 7));
    const validaHasta = new Date(ahora.getTime() + diasVigencia * 24 * 60 * 60 * 1000);

    const itemsEntidades = request.items.map((item) =>
      CotizacionB2BItem.crear(
        crypto.randomUUID(),
        cotizacionId,
        item.productoId,
        item.cantidad,
        item.precioUnitario,
        item.descuento ?? 0,
      ),
    );

    const cotizacionEntidad = new CotizacionB2B(
      cotizacionId,
      0,
      cliente.id,
      request.actor.usuarioId,
      sucursalId,
      subtotal,
      iva,
      total,
      request.medioPagoSugerido ?? 'transferencia',
      request.referenciaPago?.trim() || null,
      'pendiente_aval',
      null,
      validaHasta,
      request.observaciones?.trim() || null,
      null,
      null,
      null,
      null,
      ahora,
      ahora,
      itemsEntidades,
    );

    const guardada = await this.cotizacionRepository.crear({
      cotizacion: cotizacionEntidad,
      items: itemsEntidades,
    });

    if (this.alertaAdminRepository) {
      const descripcion = [
        `Cotización B2B #${guardada.consecutivo} pendiente de aval.`,
        `Cliente: ${cliente.nombreRazonSocial}.`,
        `Total: $${guardada.total.toLocaleString('es-CO')} COP (${guardada.items.length} ítems).`,
        `Medio sugerido: ${guardada.medioPagoSugerido}. [cotizacionId:${guardada.id}]`,
      ].join(' ');

      await this.alertaAdminRepository.crear({
        usuarioId: request.actor.usuarioId,
        sucursalId,
        motivo: 'AVAL_COTIZACION_B2B',
        prioridad: 'normal',
        descripcion: descripcion.slice(0, 500),
        destinatarioRol: 'admin-sucursal',
      });
    }

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.COTIZACIONES_B2B,
      entidadId: guardada.id,
      detalles: {
        despues: {
          consecutivo: guardada.consecutivo,
          clienteId: guardada.clienteId,
          sucursalId: guardada.sucursalId,
          total: guardada.total,
          estado: guardada.estado,
          medioPagoSugerido: guardada.medioPagoSugerido,
          itemsCount: guardada.items.length,
        },
      },
    });

    return Result.ok(guardada);
  }
}
