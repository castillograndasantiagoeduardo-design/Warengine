import { DatosDetalleStockSucursal } from './IInventarioSucursalRepository.ts';

/** Lectura de existencias de una sede completa (POS y vendedor B2B). */
export interface IConsultaStockSucursalRepository {
  /** Productos con fila en inventario_sucursal para la sede indicada. */
  listarPorSucursal(sucursalId: number): Promise<DatosDetalleStockSucursal[]>;
}
