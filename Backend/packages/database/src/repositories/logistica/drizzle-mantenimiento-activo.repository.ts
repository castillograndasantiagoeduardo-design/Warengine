import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { activos, mantenimientosActivos } from '../../schema/logistica.schema.ts';
import { proveedores } from '../../schema/inventario.schema.ts';
import {
  MantenimientoActivo,
  DatosCrearMantenimiento,
  DatosFinalizarMantenimiento,
  FiltrosListarMantenimientos,
  IMantenimientoActivoRepository,
  MantenimientoActivoDetallado,
  ResultadoPaginado,
  ResumenMantenimientos,
  TipoMantenimiento,
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

  public async listarPaginado(filtros: FiltrosListarMantenimientos): Promise<ResultadoPaginado<MantenimientoActivoDetallado>> {
    const condiciones: SQL[] = [isNull(mantenimientosActivos.deleted_at)];

    if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      condiciones.push(inArray(activos.sucursal_id, filtros.sucursalIds));
    }
    if (filtros.activoId) {
      condiciones.push(eq(mantenimientosActivos.activo_id, filtros.activoId));
    }
    if (filtros.tipo) {
      condiciones.push(eq(mantenimientosActivos.tipo, filtros.tipo));
    }
    if (filtros.estado === 'en_curso') {
      condiciones.push(isNull(mantenimientosActivos.fecha_fin));
    } else if (filtros.estado === 'finalizado') {
      condiciones.push(isNotNull(mantenimientosActivos.fecha_fin));
    }
    if (filtros.desde) {
      condiciones.push(gte(mantenimientosActivos.fecha, filtros.desde));
    }
    if (filtros.hasta) {
      condiciones.push(lte(mantenimientosActivos.fecha, filtros.hasta));
    }

    const whereClause = and(...condiciones);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(mantenimientosActivos)
      .innerJoin(activos, eq(mantenimientosActivos.activo_id, activos.id_activo))
      .where(whereClause);

    const limit = Math.max(1, filtros.limit);
    const page = Math.max(1, filtros.page);
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select({
        id: mantenimientosActivos.id_mantenimiento_activo,
        activoId: mantenimientosActivos.activo_id,
        activoCodigo: activos.codigo_activo,
        activoNombre: activos.nombre,
        sucursalId: activos.sucursal_id,
        proveedorId: mantenimientosActivos.proveedor_id,
        proveedorNombre: proveedores.nombre,
        tipo: mantenimientosActivos.tipo,
        fecha: mantenimientosActivos.fecha,
        fechaFin: mantenimientosActivos.fecha_fin,
        costo: mantenimientosActivos.costo,
        descripcion: mantenimientosActivos.descripcion,
      })
      .from(mantenimientosActivos)
      .innerJoin(activos, eq(mantenimientosActivos.activo_id, activos.id_activo))
      .leftJoin(proveedores, eq(mantenimientosActivos.proveedor_id, proveedores.id_proveedor))
      .where(whereClause)
      .orderBy(desc(mantenimientosActivos.fecha))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map((r) => ({
        id: r.id,
        activoId: r.activoId,
        activoCodigo: r.activoCodigo,
        activoNombre: r.activoNombre,
        sucursalId: r.sucursalId,
        proveedorId: r.proveedorId,
        proveedorNombre: r.proveedorNombre ?? null,
        tipo: r.tipo as TipoMantenimiento,
        fecha: r.fecha,
        fechaFin: r.fechaFin ?? null,
        costo: r.costo ? Number(r.costo) : null,
        descripcion: r.descripcion ?? null,
        enCurso: r.fechaFin === null,
      })),
      total: Number(total),
      page,
      limit,
      totalPages,
    };
  }

  public async obtenerResumen(sucursalIds?: number[]): Promise<ResumenMantenimientos> {
    const condiciones: SQL[] = [isNull(mantenimientosActivos.deleted_at)];
    if (sucursalIds && sucursalIds.length > 0) {
      condiciones.push(inArray(activos.sucursal_id, sucursalIds));
    }
    const whereClause = and(...condiciones);

    const [row] = await this.db
      .select({
        total: count(),
        enCurso: sql<number>`COALESCE(SUM(CASE WHEN ${mantenimientosActivos.fecha_fin} IS NULL THEN 1 ELSE 0 END), 0)`,
        finalizados: sql<number>`COALESCE(SUM(CASE WHEN ${mantenimientosActivos.fecha_fin} IS NOT NULL THEN 1 ELSE 0 END), 0)`,
        vencidos: sql<number>`COALESCE(SUM(CASE WHEN ${mantenimientosActivos.fecha_fin} IS NULL AND ${mantenimientosActivos.fecha} < CURDATE() THEN 1 ELSE 0 END), 0)`,
      })
      .from(mantenimientosActivos)
      .innerJoin(activos, eq(mantenimientosActivos.activo_id, activos.id_activo))
      .where(whereClause);

    return {
      total: Number(row?.total ?? 0),
      enCurso: Number(row?.enCurso ?? 0),
      finalizados: Number(row?.finalizados ?? 0),
      vencidos: Number(row?.vencidos ?? 0),
    };
  }
}
