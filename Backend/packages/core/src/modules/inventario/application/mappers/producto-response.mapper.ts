import { Producto } from '../../domain/entities/Producto.ts';
import { ProductoResponse, PERMISSIONS } from '@warengine/contracts';

/**
 * Mapea una entidad de dominio Producto a su DTO de salida ProductoResponse.
 * RF-FMC-B9 / Regla de negocio FASE 0:
 * Quien NO tenga el permiso `inventario:escribir` no debe recibir precioCompra ni proveedorId.
 */
export function toProductoResponse(producto: Producto, permisos?: string[]): ProductoResponse {
  const puedeVerCostos = permisos?.includes(PERMISSIONS.INVENTARIO_ESCRIBIR) ?? false;

  return {
    id: producto.id,
    sku: producto.sku,
    nombre: producto.nombre,
    categoriaId: producto.categoriaId,
    ...(puedeVerCostos
      ? {
          proveedorId: producto.proveedorId,
          precioCompra: producto.precioCompra,
        }
      : {}),
    precioVenta: producto.precioVenta,
    precioCorporativo: producto.precioCorporativo,
    precioCorporativoActualizadoEn: producto.precioCorporativoActualizadoEn
      ? producto.precioCorporativoActualizadoEn instanceof Date
        ? producto.precioCorporativoActualizadoEn.toISOString()
        : String(producto.precioCorporativoActualizadoEn)
      : null,
    isActive: producto.isActive,
    ...(producto.advertencia ? { advertencia: producto.advertencia } : {}),
  };
}
