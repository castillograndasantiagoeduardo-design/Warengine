/**
 * branch-invoicing.interface.ts — Contrato de servicio para supervisión de facturas y alertas.
 * 
 * Principio SOLID: Interface Segregation Principle (ISP) & Dependency Inversion (DIP).
 */

import type {
  FacturaSede,
  AlertaOperativa,
  FiltrosFacturasSede,
  FiltrosAlertasSede,
} from '../types/branch-invoicing.types';

export interface IBranchInvoicingService {
  listarFacturas(
    sucursalId: number,
    filtros?: FiltrosFacturasSede,
  ): Promise<FacturaSede[]>;

  obtenerFacturaPorId(id: string): Promise<FacturaSede>;

  anularFactura(
    id: string,
    motivo: string,
  ): Promise<{ mensaje: string; factura: FacturaSede }>;

  listarAlertas(
    sucursalId: number,
    filtros?: FiltrosAlertasSede,
  ): Promise<AlertaOperativa[]>;

  cambiarEstadoAlerta(
    id: string,
    estado: 'visto' | 'atendido',
  ): Promise<AlertaOperativa>;
}
