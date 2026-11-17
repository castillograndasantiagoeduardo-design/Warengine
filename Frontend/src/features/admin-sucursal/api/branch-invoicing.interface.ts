/**
 * branch-invoicing.interface.ts — Contrato de servicio para supervisión de facturas y alertas.
 * 
 * Principio SOLID: Interface Segregation Principle (ISP) & Dependency Inversion (DIP).
 */

import type {
  FacturaSede,
  FacturasPaginadasSede,
  AlertaOperativa,
  FiltrosFacturasSede,
  FiltrosAlertasSede,
  RegistrarDevolucionPayload,
} from '../types/branch-invoicing.types';

export interface IBranchInvoicingService {
  listarFacturas(
    sucursalId: number,
    filtros?: FiltrosFacturasSede,
  ): Promise<FacturasPaginadasSede>;

  obtenerFacturaPorId(id: string): Promise<FacturaSede>;

  anularFactura(
    id: string,
    motivo: string,
  ): Promise<{ mensaje: string; factura: FacturaSede }>;

  registrarDevolucion(
    id: string,
    payload: RegistrarDevolucionPayload,
  ): Promise<{ facturaId: string; totalReembolso: number; lineas: any[] }>;

  listarAlertas(
    sucursalId?: number,
    filtros?: FiltrosAlertasSede,
  ): Promise<AlertaOperativa[]>;

  cambiarEstadoAlerta(
    id: string,
    estado: 'visto' | 'atendido',
  ): Promise<AlertaOperativa>;
}
