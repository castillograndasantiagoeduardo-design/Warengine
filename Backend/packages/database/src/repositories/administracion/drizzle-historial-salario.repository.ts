/**
 * drizzle-historial-salario.repository.ts
 *
 * Implementación Drizzle ORM para el repositorio de historial de salarios.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados.
 */

import { desc, eq, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { historial_salarios, usuarios } from '../../schema/autenticacion.schema.ts';
import { empleados } from '../../schema/administracion.schema.ts';
import {
  HistorialSalario,
  IHistorialSalarioRepository,
  RegistrarSalarioData,
} from '@warengine/core';
import { historialSalarioFromRow } from '../../mappers/administracion/historial-salario.mapper.ts';

export class DrizzleHistorialSalarioRepository implements IHistorialSalarioRepository {
  constructor(private readonly db: Database) {}

  public async listarPorEmpleado(empleadoId: string): Promise<HistorialSalario[]> {
    const rows = await this.db
      .select({
        id: historial_salarios.id_historial_salario,
        empleadoId: historial_salarios.empleado_id,
        sueldo: historial_salarios.sueldo,
        fechaEfectiva: historial_salarios.fecha_efectiva,
        motivo: historial_salarios.motivo,
        registradoPor: historial_salarios.registrado_por,
        createdAt: historial_salarios.created_at,
        registradorNombre: sql<string | null>`COALESCE(${empleados.nombre}, ${usuarios.email})`,
      })
      .from(historial_salarios)
      .leftJoin(usuarios, eq(historial_salarios.registrado_por, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(eq(historial_salarios.empleado_id, empleadoId))
      .orderBy(desc(historial_salarios.fecha_efectiva), desc(historial_salarios.created_at));

    return rows.map(historialSalarioFromRow);
  }

  public async obtenerUltimoSalario(empleadoId: string): Promise<HistorialSalario | null> {
    const [row] = await this.db
      .select({
        id: historial_salarios.id_historial_salario,
        empleadoId: historial_salarios.empleado_id,
        sueldo: historial_salarios.sueldo,
        fechaEfectiva: historial_salarios.fecha_efectiva,
        motivo: historial_salarios.motivo,
        registradoPor: historial_salarios.registrado_por,
        createdAt: historial_salarios.created_at,
      })
      .from(historial_salarios)
      .where(eq(historial_salarios.empleado_id, empleadoId))
      .orderBy(desc(historial_salarios.fecha_efectiva), desc(historial_salarios.created_at))
      .limit(1);

    return row ? historialSalarioFromRow(row) : null;
  }

  public async registrar(data: RegistrarSalarioData): Promise<HistorialSalario> {
    const id = crypto.randomUUID();
    await this.db.insert(historial_salarios).values({
      id_historial_salario: id,
      empleado_id: data.empleadoId,
      sueldo: data.sueldo.toFixed(2),
      fecha_efectiva: data.fechaEfectiva,
      motivo: data.motivo ?? null,
      registrado_por: data.registradoPor,
    });

    const [row] = await this.db
      .select({
        id: historial_salarios.id_historial_salario,
        empleadoId: historial_salarios.empleado_id,
        sueldo: historial_salarios.sueldo,
        fechaEfectiva: historial_salarios.fecha_efectiva,
        motivo: historial_salarios.motivo,
        registradoPor: historial_salarios.registrado_por,
        createdAt: historial_salarios.created_at,
        registradorNombre: sql<string | null>`COALESCE(${empleados.nombre}, ${usuarios.email})`,
      })
      .from(historial_salarios)
      .leftJoin(usuarios, eq(historial_salarios.registrado_por, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(eq(historial_salarios.id_historial_salario, id))
      .limit(1);

    return historialSalarioFromRow(row);
  }
}
