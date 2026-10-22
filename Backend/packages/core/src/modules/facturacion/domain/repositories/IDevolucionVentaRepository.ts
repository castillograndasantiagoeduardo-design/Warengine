import { DevolucionVenta } from '../entities/DevolucionVenta.ts';

export interface ResumenDevueltoItem { cantidad: number; monto: number; }

export interface IDevolucionVentaRepository {
    /** Inserta todas las líneas en UNA transacción (todo o nada). */
    registrar(devoluciones: DevolucionVenta[]): Promise<DevolucionVenta[]>;
    /** Clave: factura_item_id. Excluye soft-deleted. */
    resumenDevueltoPorFactura(facturaId: string): Promise<Map<string, ResumenDevueltoItem>>;
    listarPorFactura(facturaId: string): Promise<DevolucionVenta[]>;
}