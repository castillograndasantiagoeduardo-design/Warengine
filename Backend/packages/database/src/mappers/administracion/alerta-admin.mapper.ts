/**
 * alerta-admin.mapper.ts
 *
 * Mapeador para transformar filas relacionales de `alertas_admin` a la entidad `AlertaAdmin`.
 *
 * Requisito SRS:
 * - RF-ADM-C13: Gestión de alertas administrativas.
 */

import { AlertaAdmin, EstadoAlerta, PrioridadAlerta } from '@warengine/core';

export interface AlertaAdminRow {
  id: string;
  usuarioId: string;
  sucursalId: number;
  motivo: string;
  prioridad: string;
  descripcion: string | null;
  estado: string;
  fechaCreacion: Date;
  fechaAtencion: Date | null;
  sucursalNombre?: string | null;
  usuarioEmail?: string | null;
}

export function alertaAdminFromRow(row: AlertaAdminRow): AlertaAdmin {
  return new AlertaAdmin(
    row.id,
    row.usuarioId,
    row.sucursalId,
    row.motivo,
    row.prioridad as PrioridadAlerta,
    row.descripcion,
    row.estado as EstadoAlerta,
    row.fechaCreacion,
    row.fechaAtencion,
    row.sucursalNombre ?? null,
    row.usuarioEmail ?? null,
  );
}
