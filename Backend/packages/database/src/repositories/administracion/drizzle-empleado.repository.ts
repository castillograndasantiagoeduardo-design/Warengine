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

import { and, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { areas, empleados, sucursales } from '../../schema/administracion.schema.ts';
import {
  ActualizarEmpleadoData,
  Empleado,
  EmpleadosPaginadosResultado,
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

  private construirCondiciones(filtros?: FiltrosEmpleados): SQL[] {
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
    if (filtros?.cargo) {
      condiciones.push(eq(empleados.cargo, filtros.cargo));
    }
    const qTerm = filtros?.busqueda?.trim();
    if (qTerm) {
      const q = `%${qTerm}%`;
      condiciones.push(
        or(
          like(empleados.nombre, q),
          like(empleados.numero_documento, q),
          like(empleados.cargo, q),
        )!,
      );
    }

    return condiciones;
  }

  public async listar(filtros?: FiltrosEmpleados): Promise<Empleado[]> {
    const condiciones = this.construirCondiciones(filtros);

    const rows = await this.consulta()
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(empleados.nombre);

    return rows.map(empleadoFromRow);
  }

  public async listarPaginado(filtros: FiltrosEmpleados): Promise<EmpleadosPaginadosResultado> {
    const condiciones = this.construirCondiciones(filtros);
    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [conteo] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(empleados)
      .where(whereClause);

    const total = Number(conteo?.total ?? 0);
    const limite = Math.min(Math.max(filtros.limite ?? 20, 1), 100);
    const page = Math.max(filtros.page ?? 1, 1);
    const totalPaginas = Math.ceil(total / limite);
    const offset = (page - 1) * limite;

    const rows = await this.consulta()
      .where(whereClause)
      .orderBy(empleados.nombre)
      .limit(limite)
      .offset(offset);

    return {
      items: rows.map(empleadoFromRow),
      total,
      totalPaginas,
      page,
      limite,
    };
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
