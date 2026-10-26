/**
 * branch-invoicing.types.ts — Tipos de dominio para supervisión de facturación y alertas de mostrador.
 * 
 * Requisitos SRS:
 * - RF-FMC-E10: Anulación administrativa de facturas emitidas por error, reingresando atómicamente el stock al kardex.
 * - RF-FMC-F1..F8: Centro de alertas operativas del mostrador (recibir y resolver incidencias de cajeros).
 * - RF-FMC-E8: Trazabilidad completa de comprobantes emitidos con folios, medios de pago y desglose tributario.
 */

export type EstadoFacturaSede = 'emitida' | 'anulada';
export type MedioPagoSede = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito_corporativo';
export type PrioridadAlertaOperativa = 'urgente' | 'normal';
export type EstadoAlertaOperativa = 'pendiente' | 'visto' | 'atendido';

export interface FacturaItemSede {
  id: string;
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface FacturaPagoSede {
  id: string;
  medioPago: MedioPagoSede;
  monto: number;
  referenciaTransaccion: string | null;
  fecha: string;
}

export interface FacturaSede {
  id: string;
  consecutivo: number;
  folioFormateado: string;
  clienteId: string;
  clienteNombre?: string;
  clienteDocumento?: string;
  usuarioId: string;
  cajeroNombre?: string;
  sucursalId: number;
  turnoCajaId: string | null;
  subtotal: number;
  iva: number;
  total: number;
  totalFormateado: string;
  estado: EstadoFacturaSede;
  fecha: string;
  fechaFormateada: string;
  items: FacturaItemSede[];
  pagos: FacturaPagoSede[];
}

export interface AlertaOperativa {
  id: string;
  sucursalId: number;
  sucursalNombre?: string;
  usuarioId: string;
  usuarioEmail?: string;
  usuarioNombre?: string;
  motivo: string;
  prioridad: PrioridadAlertaOperativa;
  descripcion: string | null;
  estado: EstadoAlertaOperativa;
  fechaCreacion: string;
  fechaAtencion?: string | null;
}

export interface AnularFacturaDTO {
  motivo: string;
}

export interface FiltrosFacturasSede {
  estado?: EstadoFacturaSede;
  clienteId?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface FiltrosAlertasSede {
  estado?: EstadoAlertaOperativa;
  prioridad?: PrioridadAlertaOperativa;
}
