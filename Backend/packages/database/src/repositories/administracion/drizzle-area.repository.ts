/**
 * drizzle-area.repository.ts
 *
 * Implementación Drizzle ORM del repositorio de áreas operativas por sucursal.
 *
 * Rol en la arquitectura:
 * - Capa de Infraestructura / Persistencia (Adaptador de Repositorio).
 * - Implementa el puerto `IAreaRepository` interactuando directamente con MySQL 8
 *   a través de las tablas `areas` y `empleados`.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Gestión de áreas por sucursal.
 */

import { and, count, eq, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { areas, empleados } from '../../schema/administracion.schema.ts';
import { Area, IAreaRepository } from '@warengine/core';
import { areaFromRow } from '../../mappers/administracion/area.mapper.ts';

export class DrizzleAreaRepository implements IAreaRepository {
  constructor(private readonly db: Database) {}

  public async listarPorSucursal(sucursalId: number): Promise<Area[]> {
    const rows = await this.db
      .select()
      .from(areas)
      .where(eq(areas.sucursal_id, sucursalId))
      .orderBy(areas.nombre);
    return rows.map(areaFromRow);
  }

  public async findById(id: number): Promise<Area | null> {
    const [row] = await this.db
      .select()
      .from(areas)
      .where(eq(areas.id_area, id))
      .limit(1);
    return row ? areaFromRow(row) : null;
  }

  public async findByNombreYSucursal(
    nombre: string,
    sucursalId: number,
  ): Promise<Area | null> {
    const [row] = await this.db
      .select()
      .from(areas)
      .where(
        and(
          eq(areas.sucursal_id, sucursalId),
          sql`LOWER(TRIM(${areas.nombre})) = LOWER(TRIM(${nombre}))`,
        ),
      )
      .limit(1);
    return row ? areaFromRow(row) : null;
  }

  public async crear(data: { nombre: string; sucursalId: number }): Promise<Area> {
    const [res] = await this.db.insert(areas).values({
      nombre: data.nombre,
      sucursal_id: data.sucursalId,
    });
    return (await this.findById(res.insertId)) as Area;
  }

  public async actualizar(id: number, data: { nombre: string }): Promise<Area> {
    await this.db
      .update(areas)
      .set({ nombre: data.nombre })
      .where(eq(areas.id_area, id));
    return (await this.findById(id)) as Area;
  }

  public async eliminar(id: number): Promise<void> {
    await this.db.delete(areas).where(eq(areas.id_area, id));
  }

  public async contarEmpleadosEnArea(id: number): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(empleados)
      .where(eq(empleados.area_id, id));
    return Number(row?.total ?? 0);
  }
}
