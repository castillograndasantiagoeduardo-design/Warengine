import { Factura } from '../entities/Factura.ts';
import { FacturaItem } from '../entities/FacturaItem.ts';
import { FacturaPago } from '../entities/FacturaPago.ts';

export interface FiltrosFacturas {
    sucursalId?: number;
    clienteId?: string;
    usuarioId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    estado?: 'emitida' | 'anulada';
    limite: number;
    offset: number;
}

export interface CrearFacturaDatos {
    factura: Factura;
    items: FacturaItem[];
    pagos: FacturaPago[];
}

export interface IFacturaRepository {
    crear(datos: CrearFacturaDatos): Promise<Factura>;
    findById(id: string): Promise<Factura | null>;
    listar(filtros: FiltrosFacturas): Promise<Factura[]>;
    obtenerSiguienteConsecutivo(sucursalId: number): Promise<number>;
    /**
     * Pasa la factura de 'emitida' a 'anulada' de forma atómica (RF-FMC-E10).
     * El trigger trg_facturas_anula_reingresa_stock reingresa el stock al kardex.
     * Devuelve null si no había una factura 'emitida' con ese id (ya anulada o inexistente).
     */
    anular(id: string, anuladaPor: string): Promise<Factura | null>;
}
