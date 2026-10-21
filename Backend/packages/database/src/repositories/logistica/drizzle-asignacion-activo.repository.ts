import { and, desc, eq, isNull } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { asignacionesActivos } from '../../schema/logistica.schema.ts';
import { empleados, areas } from '../../schema/administracion.schema.ts';
import {
  AsignacionActivo,
  DatosCrearAsignacion,
  IAsignacionActivoRepository,
} from '@warengine/core';
import { asignacionActivoFromRow, AsignacionJoinRow } from '../../mappers/logistica/asignacion-activo.mapper.ts';

const SELECCION = {
  id: asignacionesActivos.id_asignacion_activo,
  activoId: asignacionesActivos.activo_id,
  empleadoId: asignacionesActivos.empleado_id,
  empleadoNombre: empleados.nombre,
  areaId: asignacionesActivos.area_id,
  areaNombre: areas.nombre,
  sucursalId: asignacionesActivos.sucursal_id,
  asignadoPor: asignacionesActivos.asignado_por,
  fechaAsignacion: asignacionesActivos.fecha_asignacion,
  fechaDevolucionEsperada: asignacionesActivos.fecha_devolucion_esperada,
  fechaDevolucionReal: asignacionesActivos.fecha_devolucion_real,
  estado: asignacionesActivos.estado,
  observaciones: asignacionesActivos.observaciones,
};

export class DrizzleAsignacionActivoRepository implements IAsignacionActivoRepository {
  constructor(private readonly db: Database) {}

  private consulta() {
    return this.db
      .select(SELECCION)
      .from(asignacionesActivos)
      .leftJoin(empleados, eq(asignacionesActivos.empleado_id, empleados.id_empleado))
      .leftJoin(areas, eq(asignacionesActivos.area_id, areas.id_area));
  }

  public async crear(datos: DatosCrearAsignacion): Promise<AsignacionActivo> {
    const id = crypto.randomUUID();
    await this.db.insert(asignacionesActivos).values({
      id_asignacion_activo: id,
      activo_id: datos.activoId,
      empleado_id: datos.empleadoId,
      area_id: datos.areaId,
      sucursal_id: datos.sucursalId,
      asignado_por: datos.asignadoPor,
      fecha_devolucion_esperada: datos.fechaDevolucionEsperada,
      observaciones: datos.observaciones,
    });
    return (await this.findById(id)) as AsignacionActivo;
  }

  public async findActivaPorActivo(activoId: string): Promise<AsignacionActivo | null> {
    const [row] = await this.consulta()
      .where(and(
        eq(asignacionesActivos.activo_id, activoId),
        eq(asignacionesActivos.estado, 'activa'),
        isNull(asignacionesActivos.fecha_devolucion_real),
      ))
      .limit(1);
    return row ? asignacionActivoFromRow(row as unknown as AsignacionJoinRow) : null;
  }

  public async listarPorActivo(activoId: string): Promise<AsignacionActivo[]> {
    const rows = await this.consulta()
      .where(eq(asignacionesActivos.activo_id, activoId))
      .orderBy(desc(asignacionesActivos.fecha_asignacion));
    return rows.map((r) => asignacionActivoFromRow(r as unknown as AsignacionJoinRow));
  }

  public async registrarDevolucion(
    id: string,
    fechaReal: Date,
    observaciones: string | null,
  ): Promise<AsignacionActivo> {
    const set: Record<string, unknown> = {
      fecha_devolucion_real: fechaReal,
    };
    if (observaciones !== null) {
      set.observaciones = observaciones;
    }
    await this.db
      .update(asignacionesActivos)
      .set(set)
      .where(eq(asignacionesActivos.id_asignacion_activo, id));
    return (await this.findById(id)) as AsignacionActivo;
  }

  private async findById(id: string): Promise<AsignacionActivo | null> {
    const [row] = await this.consulta()
      .where(eq(asignacionesActivos.id_asignacion_activo, id))
      .limit(1);
    return row ? asignacionActivoFromRow(row as unknown as AsignacionJoinRow) : null;
  }
}
