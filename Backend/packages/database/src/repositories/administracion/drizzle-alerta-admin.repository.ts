/**
 * drizzle-alerta-admin.repository.ts
 *
 * Implementación Drizzle ORM para el repositorio de alertas administrativas.
 *
 * Requisito SRS:
 * - RF-ADM-C13: Gestión de alertas administrativas (alertas_admin).
 */

import { and, desc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { alertas_admin, usuarios } from '../../schema/autenticacion.schema.ts';
import { sucursales } from '../../schema/administracion.schema.ts';
import {
  AlertaAdmin,
  CrearAlertaAdminData,
  EstadoAlerta,
  FiltrosAlertasAdmin,
  IAlertaAdminRepository,
} from '@warengine/core';
import { alertaAdminFromRow } from '../../mappers/administracion/alerta-admin.mapper.ts';

const SELECCION = {
  id: alertas_admin.id_alerta_admin,
  usuarioId: alertas_admin.usuario_id,
  sucursalId: alertas_admin.sucursal_id,
  motivo: alertas_admin.motivo,
  prioridad: alertas_admin.prioridad,
  descripcion: alertas_admin.descripcion,
  estado: alertas_admin.estado,
  fechaCreacion: alertas_admin.fecha_creacion,
  fechaAtencion: alertas_admin.fecha_atencion,
  sucursalNombre: sucursales.nombre,
  usuarioEmail: usuarios.email,
};

export class DrizzleAlertaAdminRepository implements IAlertaAdminRepository {
  constructor(private readonly db: Database) {}

  private consulta() {
    return this.db
      .select(SELECCION)
      .from(alertas_admin)
      .innerJoin(sucursales, eq(alertas_admin.sucursal_id, sucursales.id_sucursal))
      .innerJoin(usuarios, eq(alertas_admin.usuario_id, usuarios.id_usuario));
  }

  public async listar(filtros?: FiltrosAlertasAdmin): Promise<AlertaAdmin[]> {
    const condiciones: SQL[] = [];

    if (filtros?.sucursalIds !== undefined && filtros.sucursalIds.length > 0) {
      condiciones.push(inArray(alertas_admin.sucursal_id, filtros.sucursalIds));
    }
    if (filtros?.estado !== undefined) {
      condiciones.push(eq(alertas_admin.estado, filtros.estado));
    }
    if (filtros?.prioridad !== undefined) {
      condiciones.push(eq(alertas_admin.prioridad, filtros.prioridad));
    }

    const rows = await this.consulta()
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(
        sql`CASE WHEN ${alertas_admin.prioridad} = 'urgente' THEN 1 ELSE 2 END`,
        desc(alertas_admin.fecha_creacion),
      );

    return rows.map(alertaAdminFromRow);
  }

  public async findById(id: string): Promise<AlertaAdmin | null> {
    const [row] = await this.consulta()
      .where(eq(alertas_admin.id_alerta_admin, id))
      .limit(1);

    return row ? alertaAdminFromRow(row) : null;
  }

  public async crear(data: CrearAlertaAdminData): Promise<AlertaAdmin> {
    const id = crypto.randomUUID();
    await this.db.insert(alertas_admin).values({
      id_alerta_admin: id,
      usuario_id: data.usuarioId,
      sucursal_id: data.sucursalId,
      motivo: data.motivo,
      prioridad: data.prioridad ?? 'normal',
      descripcion: data.descripcion ?? null,
      estado: 'pendiente',
    });

    const creada = await this.findById(id);
    return creada!;
  }

  public async actualizarEstado(
    id: string,
    estado: EstadoAlerta,
    fechaAtencion?: Date | null,
  ): Promise<AlertaAdmin> {
    await this.db
      .update(alertas_admin)
      .set({
        estado,
        fecha_atencion: fechaAtencion ?? null,
      })
      .where(eq(alertas_admin.id_alerta_admin, id));

    const actualizada = await this.findById(id);
    return actualizada!;
  }
}
