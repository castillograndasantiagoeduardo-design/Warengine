/**
 * drizzle-empleado.repository.ts
 *
 * Implementación Drizzle ORM del repositorio de gestión de empleados.
 *
 * Rol en la arquitectura:
 * - Capa de Infraestructura / Persistencia (Adaptador de Repositorio).
 * - Realiza consultas con joins sobre `empleados`, `sucursales` y `areas`
 *   para proveer al caso de uso la visión agregada del personal laboral.
 *
 * Requisito SRS:
 * - RF-ADM-C12: Edición independiente de datos de empleados.
 * - RF-ADM-C5: Listado de empleados con filtros combinables.
 */

import { and, eq, inArray, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { areas, empleados, sucursales } from '../../schema/administracion.schema.ts';
import {
  ActualizarEmpleadoData,
  Empleado,
  FiltrosEmpleados,
  IEmpleadoRepository,
} from '@warengine/core';
import { empleadoFromRow } from '../../mappers/administracion/empleado.mapper.ts';

const SELECCION = {
  id: empleados.id_empleado,
  tipoDocumento: empleados.tipo_documento,
  numeroDocumento: empleados.numero_documento,
  nombre: empleados.nombre,
  telefono: empleados.telefono,
  direccion: empleados.direccion,
  cargo: empleados.cargo,
  areaId: empleados.area_id,
  areaNombre: areas.nombre,
  sucursalId: empleados.sucursal_id,
  sucursalNombre: sucursales.nombre,
  fechaIngreso: empleados.fecha_ingreso,
  sueldoActual: empleados.sueldo_actual,
  isActive: empleados.is_active,
};

export class DrizzleEmpleadoRepository implements IEmpleadoRepository {
  constructor(private readonly db: Database) {}

  private consulta() {
    return this.db
      .select(SELECCION)
      .from(empleados)
      .innerJoin(sucursales, eq(empleados.sucursal_id, sucursales.id_sucursal))
      .leftJoin(areas, eq(empleados.area_id, areas.id_area));
  }

  public async listar(filtros?: FiltrosEmpleados): Promise<Empleado[]> {
    const condiciones: SQL[] = [];

    if (filtros?.sucursalId !== undefined) {
      condiciones.push(eq(empleados.sucursal_id, filtros.sucursalId));
    }
    if (filtros?.sucursalIds !== undefined) {
      condiciones.push(inArray(empleados.sucursal_id, filtros.sucursalIds));
    }
    if (filtros?.areaId !== undefined) {
      condiciones.push(eq(empleados.area_id, filtros.areaId));
    }
    if (filtros?.isActive !== undefined) {
      condiciones.push(eq(empleados.is_active, filtros.isActive ? 1 : 0));
    }

    const rows = await this.consulta()
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(empleados.nombre);

    return rows.map(empleadoFromRow);
  }

  public async findById(id: string): Promise<Empleado | null> {
    const [row] = await this.consulta()
      .where(eq(empleados.id_empleado, id))
      .limit(1);

    return row ? empleadoFromRow(row) : null;
  }

  public async actualizarDatos(
    id: string,
    data: ActualizarEmpleadoData,
  ): Promise<Empleado> {
    const set: Partial<typeof empleados.$inferInsert> = {};

    if (data.nombre !== undefined) set.nombre = data.nombre;
    if (data.telefono !== undefined) set.telefono = data.telefono;
    if (data.direccion !== undefined) set.direccion = data.direccion;
    if (data.cargo !== undefined) set.cargo = data.cargo;
    if (data.areaId !== undefined) set.area_id = data.areaId;
    if (data.isActive !== undefined) set.is_active = data.isActive ? 1 : 0;

    await this.db.update(empleados).set(set).where(eq(empleados.id_empleado, id));

    return (await this.findById(id)) as Empleado;
  }
}
