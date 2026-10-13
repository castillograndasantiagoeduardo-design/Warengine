/**
 * AlertaAdmin.ts
 *
 * Entidad de dominio para las alertas administrativas y operativas de Warengine.
 *
 * Requisito SRS:
 * - RF-ADM-C13: Gestión de alertas administrativas (alertas_admin).
 */

export type PrioridadAlerta = 'urgente' | 'normal';
export type EstadoAlerta = 'pendiente' | 'visto' | 'atendido';

export class AlertaAdmin {
  constructor(
    public readonly id: string,
    public readonly usuarioId: string,
    public readonly sucursalId: number,
    public readonly motivo: string,
    public readonly prioridad: PrioridadAlerta,
    public readonly descripcion: string | null,
    public readonly estado: EstadoAlerta,
    public readonly fechaCreacion: Date,
    public readonly fechaAtencion: Date | null,
    public readonly sucursalNombre?: string | null,
    public readonly usuarioEmail?: string | null,
  ) {}
}
