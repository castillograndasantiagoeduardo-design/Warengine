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
}
