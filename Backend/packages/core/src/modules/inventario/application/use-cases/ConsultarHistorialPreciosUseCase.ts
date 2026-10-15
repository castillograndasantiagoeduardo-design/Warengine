import { Result, DomainError } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ProductoNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';
import {
  IAuditoriaRepository,
} from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  HistorialPreciosResponse,
  ItemHistorialPrecio,
  PERMISSIONS,
} from '@warengine/contracts';

export interface ConsultarHistorialPreciosRequest {
  productoId: string;
  actor?: ActorAuditoria;
}

export type ConsultarHistorialPreciosResponse = Result<HistorialPreciosResponse, DomainError>;

/**
 * Caso de uso: ConsultarHistorialPreciosUseCase (RF-ADM-B14)
 *
 * Permite consultar el historial de cambios de precios (compra, venta y corporativo)
 * de un producto específico, indicando la fecha de modificación, el usuario responsable
 * y los valores anteriores y nuevos.
 *
 * Regla de protección de costos corporativos:
 * Quien no cuente con el permiso `inventario:escribir` (ej. cajeros y vendedores B2B)
 * recibe los precios de compra (costos de adquisición) en `null`.
 */
export class ConsultarHistorialPreciosUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly auditoriaRepository: IAuditoriaRepository,
  ) {}

  public async execute(
    request: ConsultarHistorialPreciosRequest,
  ): Promise<ConsultarHistorialPreciosResponse> {
    // 1. Validar existencia del producto
    const producto = await this.productoRepository.findById(request.productoId);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    // 2. Consultar logs de auditoría para la entidad producto
    const pagina = await this.auditoriaRepository.listar({
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: request.productoId,
      limite: 100,
      offset: 0,
    });

    const puedeVerCostos = request.actor?.permisos?.includes(PERMISSIONS.INVENTARIO_ESCRIBIR) ?? false;
    const items: ItemHistorialPrecio[] = [];

    // 3. Procesar logs y extraer eventos de cambio de precios
    for (const log of pagina.items) {
      const detalles = log.detalles as Record<string, any> | null;
      if (!detalles) continue;

      let huboCambioPrecio = false;
      let precioCompraAnterior: number | null = null;
      let precioCompraNuevo: number | null = null;
      let precioVentaAnterior: number | null = null;
      let precioVentaNuevo: number | null = null;
      let precioCorporativoAnterior: number | null = null;
      let precioCorporativoNuevo: number | null = null;

      if (detalles.cambioPrecio) {
        const cp = detalles.cambioPrecio;
        if (cp.precioCompra) {
          huboCambioPrecio = true;
          precioCompraAnterior = cp.precioCompra.antes !== undefined ? (cp.precioCompra.antes !== null ? Number(cp.precioCompra.antes) : null) : null;
          precioCompraNuevo = cp.precioCompra.despues !== undefined ? (cp.precioCompra.despues !== null ? Number(cp.precioCompra.despues) : null) : null;
        }
        if (cp.precioVenta) {
          huboCambioPrecio = true;
          precioVentaAnterior = cp.precioVenta.antes !== undefined ? (cp.precioVenta.antes !== null ? Number(cp.precioVenta.antes) : null) : null;
          precioVentaNuevo = cp.precioVenta.despues !== undefined ? (cp.precioVenta.despues !== null ? Number(cp.precioVenta.despues) : null) : null;
        }
        if (cp.precioCorporativo) {
          huboCambioPrecio = true;
          precioCorporativoAnterior = cp.precioCorporativo.antes !== undefined ? (cp.precioCorporativo.antes !== null ? Number(cp.precioCorporativo.antes) : null) : null;
          precioCorporativoNuevo = cp.precioCorporativo.despues !== undefined ? (cp.precioCorporativo.despues !== null ? Number(cp.precioCorporativo.despues) : null) : null;
        }
      } else if (detalles.antes && detalles.despues) {
        // Soporte retrocompatible con logs de edición estándar
        const { antes, despues } = detalles;
        if ('precioCompra' in antes || 'precioCompra' in despues) {
          huboCambioPrecio = true;
          precioCompraAnterior = antes.precioCompra !== undefined && antes.precioCompra !== null ? Number(antes.precioCompra) : null;
          precioCompraNuevo = despues.precioCompra !== undefined && despues.precioCompra !== null ? Number(despues.precioCompra) : null;
        }
        if ('precioVenta' in antes || 'precioVenta' in despues) {
          huboCambioPrecio = true;
          precioVentaAnterior = antes.precioVenta !== undefined && antes.precioVenta !== null ? Number(antes.precioVenta) : null;
          precioVentaNuevo = despues.precioVenta !== undefined && despues.precioVenta !== null ? Number(despues.precioVenta) : null;
        }
        if ('precioCorporativo' in antes || 'precioCorporativo' in despues) {
          huboCambioPrecio = true;
          precioCorporativoAnterior = antes.precioCorporativo !== undefined && antes.precioCorporativo !== null ? Number(antes.precioCorporativo) : null;
          precioCorporativoNuevo = despues.precioCorporativo !== undefined && despues.precioCorporativo !== null ? Number(despues.precioCorporativo) : null;
        }
      } else if (log.accion === 'crear' && detalles.despues) {
        // Registro inicial de precios en la creación del producto
        huboCambioPrecio = true;
        precioCompraAnterior = null;
        precioCompraNuevo = detalles.despues.precioCompra !== undefined && detalles.despues.precioCompra !== null ? Number(detalles.despues.precioCompra) : null;
        precioVentaAnterior = null;
        precioVentaNuevo = detalles.despues.precioVenta !== undefined && detalles.despues.precioVenta !== null ? Number(detalles.despues.precioVenta) : null;
        precioCorporativoAnterior = null;
        precioCorporativoNuevo = detalles.despues.precioCorporativo !== undefined && detalles.despues.precioCorporativo !== null ? Number(detalles.despues.precioCorporativo) : null;
      }

      // Si este log no modificó precios (ej. solo cambió nombre o categoría), lo omitimos
      if (!huboCambioPrecio) {
        continue;
      }

      // Aplicar regla de confidencialidad en costos
      items.push({
        id: log.id,
        fecha: log.fecha instanceof Date ? log.fecha.toISOString() : String(log.fecha),
        usuarioId: log.usuarioId,
        usuarioNombre: log.usuarioNombre,
        accion: log.accion,
        precioCompraAnterior: puedeVerCostos ? precioCompraAnterior : null,
        precioCompraNuevo: puedeVerCostos ? precioCompraNuevo : null,
        precioVentaAnterior,
        precioVentaNuevo,
        precioCorporativoAnterior: precioCorporativoAnterior ?? undefined,
        precioCorporativoNuevo: precioCorporativoNuevo ?? undefined,
      });
    }

    return Result.ok({
      productoId: producto.id,
      items,
      total: items.length,
    });
  }
}
