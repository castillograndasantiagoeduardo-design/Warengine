import { and, desc, eq, isNull } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { mantenimientosActivos } from '../../schema/logistica.schema.ts';
import { proveedores } from '../../schema/inventario.schema.ts';
import {
  MantenimientoActivo,
  DatosCrearMantenimiento,
  DatosFinalizarMantenimiento,
  IMantenimientoActivoRepository,
} from '@warengine/core';
import { mantenimientoActivoFromRow, MantenimientoJoinRow } from '../../mappers/logistica/mantenimiento-activo.mapper.ts';

const SELECCION = {
  id: mantenimientosActivos.id_mantenimiento_activo,
  activoId: mantenimientosActivos.activo_id,
  proveedorId: mantenimientosActivos.proveedor_id,
  proveedorNombre: proveedores.nombre,
  tipo: mantenimientosActivos.tipo,
  fecha: mantenimientosActivos.fecha,
  fechaFin: mantenimientosActivos.fecha_fin,
  costo: mantenimientosActivos.costo,
  descripcion: mantenimientosActivos.descripcion,
};

export class DrizzleMantenimientoActivoRepository implements IMantenimientoActivoRepository {
  constructor(private readonly db: Database) {}

  private consulta() {
    return this.db
      .select(SELECCION)
      .from(mantenimientosActivos)
      .leftJoin(proveedores, eq(mantenimientosActivos.proveedor_id, proveedores.id_proveedor));
  }

  public async crear(datos: DatosCrearMantenimiento): Promise<MantenimientoActivo> {
    const id = crypto.randomUUID();
    await this.db.insert(mantenimientosActivos).values({
      id_mantenimiento_activo: id,
      activo_id: datos.activoId,
      proveedor_id: datos.proveedorId,
      tipo: datos.tipo,
      fecha: datos.fecha ?? undefined,
      costo: datos.costo?.toFixed(2),
      descripcion: datos.descripcion,
    });
    return (await this.findById(id)) as MantenimientoActivo;
  }

  public async findById(id: string): Promise<MantenimientoActivo | null> {
    const [row] = await this.consulta()
      .where(and(
        eq(mantenimientosActivos.id_mantenimiento_activo, id),
        isNull(mantenimientosActivos.deleted_at),
      ))
      .limit(1);
    return row ? mantenimientoActivoFromRow(row as unknown as MantenimientoJoinRow) : null;
  }

  public async findEnCursoPorActivo(activoId: string): Promise<MantenimientoActivo | null> {
    const [row] = await this.consulta()
      .where(and(
        eq(mantenimientosActivos.activo_id, activoId),
        isNull(mantenimientosActivos.fecha_fin),
        isNull(mantenimientosActivos.deleted_at),
      ))
      .limit(1);
    return row ? mantenimientoActivoFromRow(row as unknown as MantenimientoJoinRow) : null;
  }

  public async listarPorActivo(activoId: string): Promise<MantenimientoActivo[]> {
    const rows = await this.consulta()
      .where(and(
        eq(mantenimientosActivos.activo_id, activoId),
        isNull(mantenimientosActivos.deleted_at),
      ))
      .orderBy(desc(mantenimientosActivos.fecha));
    return rows.map((r) => mantenimientoActivoFromRow(r as unknown as MantenimientoJoinRow));
  }

  public async finalizar(id: string, datos: DatosFinalizarMantenimiento): Promise<MantenimientoActivo> {
    const set: Record<string, unknown> = {
      fecha_fin: datos.fechaFin,
    };
    if (datos.costo !== undefined) set.costo = datos.costo.toFixed(2);
    if (datos.descripcion !== undefined) set.descripcion = datos.descripcion;

    await this.db
      .update(mantenimientosActivos)
      .set(set)
      .where(eq(mantenimientosActivos.id_mantenimiento_activo, id));
    return (await this.findById(id)) as MantenimientoActivo;
  }
}
