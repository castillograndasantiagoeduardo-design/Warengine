import { InventarioSucursal } from '../entities/InventarioSucursal.ts';

export interface DatosDetalleStockSucursal {
  productoId: string;
  nombreProducto: string;
  sku: string;
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  alertaAbastecimiento: boolean;
}

/**
 * Puerto de repositorio para el control de existencias y configuración de umbrales
 * por producto y sucursal (RF-ADM-B11 / RF-ADM-A3).
 */
export interface IInventarioSucursalRepository {
  /**
   * Obtiene la entidad InventarioSucursal para un producto y sucursal.
   */
  obtener(productoId: string, sucursalId: number): Promise<InventarioSucursal | null>;

  /**
   * Obtiene el detalle ampliado (con nombres de producto, SKU y sucursal).
   */
  obtenerDetalle(productoId: string, sucursalId: number): Promise<DatosDetalleStockSucursal | null>;

  /**
   * Define o actualiza el umbral de stock mínimo para un producto en una sucursal.
   * Si no existe registro previo en la sucursal, lo inicializa con stock_actual = 0.
   */
  establecerStockMinimo(
    productoId: string,
    sucursalId: number,
    stockMinimo: number,
  ): Promise<InventarioSucursal>;
}
