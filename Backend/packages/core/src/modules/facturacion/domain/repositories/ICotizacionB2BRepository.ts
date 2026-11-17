import type { EstadoCotizacionB2B, EstadoPedidoB2B } from '@warengine/contracts';
import { CotizacionB2B, CotizacionB2BItem } from '../entities/CotizacionB2B.ts';

export interface CrearCotizacionB2BDatos {
  cotizacion: CotizacionB2B;
  items: CotizacionB2BItem[];
}

export interface FiltrosCotizacionesB2B {
  sucursalIds?: number[];
  vendedorId?: string;
  clienteId?: string;
  estado?: EstadoCotizacionB2B;
  estadoPedido?: EstadoPedidoB2B;
  limite: number;
  offset: number;
}

export interface ICotizacionB2BRepository {
  crear(datos: CrearCotizacionB2BDatos): Promise<CotizacionB2B>;
  findById(id: string): Promise<CotizacionB2B | null>;
  listar(filtros: FiltrosCotizacionesB2B): Promise<CotizacionB2B[]>;
  otorgarAval(id: string, aprobadoPor: string, fechaAval: Date): Promise<CotizacionB2B | null>;
  rechazar(id: string, rechazadoPor: string, fechaAval: Date, motivoRechazo: string): Promise<CotizacionB2B | null>;
  marcarFacturadaYEnProceso(id: string, facturaId: string): Promise<CotizacionB2B | null>;
  actualizarEstadoPedido(id: string, estadoPedido: EstadoPedidoB2B): Promise<CotizacionB2B | null>;
}
