/**
 * IAlertaAdminRepository.ts
 *
 * Puerto de repositorio para la persistencia de alertas administrativas.
 *
 * Requisito SRS:
 * - RF-ADM-C13: Gestión de alertas administrativas (alertas_admin).
 */

import { AlertaAdmin, EstadoAlerta, PrioridadAlerta } from '../entities/AlertaAdmin.ts';

export interface FiltrosAlertasAdmin {
  sucursalIds?: number[];
  estado?: EstadoAlerta;
  prioridad?: PrioridadAlerta;
}

export interface CrearAlertaAdminData {
  usuarioId: string;
  sucursalId: number;
  motivo: string;
  prioridad?: PrioridadAlerta;
  descripcion?: string | null;
}

export interface IAlertaAdminRepository {
  listar(filtros?: FiltrosAlertasAdmin): Promise<AlertaAdmin[]>;
  findById(id: string): Promise<AlertaAdmin | null>;
  crear(data: CrearAlertaAdminData): Promise<AlertaAdmin>;
  actualizarEstado(id: string, estado: EstadoAlerta, fechaAtencion?: Date | null): Promise<AlertaAdmin>;
}
