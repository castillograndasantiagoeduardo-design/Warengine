import { and, count, eq, exists, inArray, isNull, like, or, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { activos, categoriasActivos, asignacionesActivos } from '../../schema/logistica.schema.ts';
import {
  Activo,
  DatosActualizarActivo,
  DatosCrearActivo,
  FiltrosListarActivos,
  IActivoRepository,
  ResumenActivos,
  ResultadoPaginado,
} from '@warengine/core';
import { activoFromRow, ActivoJoinRow } from '../../mappers/logistica/activo.mapper.ts';

const SELECCION = {
  id: activos.id_activo,
  codigoActivo: activos.codigo_activo,
  nombre: activos.nombre,
  categoriaActivoId: activos.categoria_activo_id,
  categoriaNombre: categoriasActivos.nombre,
  sucursalId: activos.sucursal_id,
  estado: activos.estado,
  valorAdquisicion: activos.valor_adquisicion,
  fechaAdquisicion: activos.fecha_adquisicion,
  condicion: activos.condicion,
  isActive: activos.is_active,
};

export class DrizzleActivoRepository implements IActivoRepository {
  constructor(private readonly db: Database) {}

  private consulta() {
    return this.db
      .select(SELECCION)
      .from(activos)
      .leftJoin(categoriasActivos, eq(activos.categoria_activo_id, categoriasActivos.id_categoria_activo));
  }

  public async listar(filtros: FiltrosListarActivos): Promise<ResultadoPaginado<Activo>> {
    const condiciones: SQL[] = [];

    if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      condiciones.push(inArray(activos.sucursal_id, filtros.sucursalIds));
    }
    if (filtros.categoriaActivoId !== undefined) {
      condiciones.push(eq(activos.categoria_activo_id, filtros.categoriaActivoId));
    }
    if (filtros.estado !== undefined) {
      condiciones.push(eq(activos.estado, filtros.estado));
    }
    if (filtros.busqueda) {
      const term = `%${filtros.busqueda}%`;
      condiciones.push(or(
        like(activos.nombre, term),
        like(activos.codigo_activo, term),
      )!);
    }
    if (filtros.areaId !== undefined) {
      condiciones.push(
        exists(
          this.db.select({ x: sql`1` })
            .from(asignacionesActivos)
            .where(and(
              eq(asignacionesActivos.activo_id, activos.id_activo),
              eq(asignacionesActivos.area_id, filtros.areaId),
              isNull(asignacionesActivos.fecha_devolucion_real),
              eq(asignacionesActivos.estado, 'activa'),
            )),
        ),
      );
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(activos)
      .leftJoin(categoriasActivos, eq(activos.categoria_activo_id, categoriasActivos.id_categoria_activo))
      .where(whereClause);

    const limit = Math.max(1, filtros.limit);
    const page = Math.max(1, filtros.page);
    const offset = (page - 1) * limit;

    const rows = await this.consulta()
      .where(whereClause)
      .orderBy(activos.nombre)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map((r) => activoFromRow(r as unknown as ActivoJoinRow)),
      total: Number(total),
      page,
      limit,
      totalPages,
    };
  }

  public async findById(id: string): Promise<Activo | null> {
    const [row] = await this.consulta()
      .where(eq(activos.id_activo, id))
      .limit(1);
    return row ? activoFromRow(row as unknown as ActivoJoinRow) : null;
  }

  public async findByCodigo(codigoActivo: string): Promise<Activo | null> {
    const [row] = await this.consulta()
      .where(eq(activos.codigo_activo, codigoActivo))
      .limit(1);
    return row ? activoFromRow(row as unknown as ActivoJoinRow) : null;
  }

  public async crear(datos: DatosCrearActivo): Promise<Activo> {
    const id = crypto.randomUUID();
    await this.db.insert(activos).values({
      id_activo: id,
      codigo_activo: datos.codigoActivo,
      nombre: datos.nombre,
      categoria_activo_id: datos.categoriaActivoId,
      sucursal_id: datos.sucursalId,
      valor_adquisicion: datos.valorAdquisicion?.toFixed(2),
      fecha_adquisicion: datos.fechaAdquisicion,
      condicion: datos.condicion,
    });
    return (await this.findById(id)) as Activo;
  }

  public async actualizar(id: string, datos: DatosActualizarActivo): Promise<Activo> {
    const valores: Record<string, unknown> = {};
    if (datos.nombre !== undefined) valores.nombre = datos.nombre;
    if (datos.categoriaActivoId !== undefined) valores.categoria_activo_id = datos.categoriaActivoId;
    if (datos.valorAdquisicion !== undefined) {
      valores.valor_adquisicion = datos.valorAdquisicion === null ? null : datos.valorAdquisicion.toFixed(2);
    }
    if (datos.fechaAdquisicion !== undefined) valores.fecha_adquisicion = datos.fechaAdquisicion;
    if (datos.condicion !== undefined) valores.condicion = datos.condicion;

    if (Object.keys(valores).length > 0) {
      await this.db
        .update(activos)
        .set(valores)
        .where(eq(activos.id_activo, id));
    }
    return (await this.findById(id)) as Activo;
  }

  public async marcarBaja(id: string): Promise<Activo> {
    await this.db
      .update(activos)
      .set({ estado: 'baja', is_active: 0 })
      .where(eq(activos.id_activo, id));
    return (await this.findById(id)) as Activo;
  }

  public async obtenerResumen(sucursalIds?: number[]): Promise<ResumenActivos> {
    const condiciones: SQL[] = [];
    if (sucursalIds && sucursalIds.length > 0) {
      condiciones.push(inArray(activos.sucursal_id, sucursalIds));
    }
    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [row] = await this.db
      .select({
        total: count(),
        disponibles: sql<number>`COALESCE(SUM(CASE WHEN ${activos.estado} = 'disponible' THEN 1 ELSE 0 END), 0)`,
        asignados: sql<number>`COALESCE(SUM(CASE WHEN ${activos.estado} = 'asignado' THEN 1 ELSE 0 END), 0)`,
        enMantenimiento: sql<number>`COALESCE(SUM(CASE WHEN ${activos.estado} = 'mantenimiento' THEN 1 ELSE 0 END), 0)`,
        deBaja: sql<number>`COALESCE(SUM(CASE WHEN ${activos.estado} = 'baja' THEN 1 ELSE 0 END), 0)`,
        valorTotal: sql<number>`COALESCE(SUM(CASE WHEN ${activos.estado} != 'baja' THEN ${activos.valor_adquisicion} ELSE 0 END), 0)`,
      })
      .from(activos)
      .where(whereClause);

    return {
      total: Number(row?.total ?? 0),
      disponibles: Number(row?.disponibles ?? 0),
      asignados: Number(row?.asignados ?? 0),
      enMantenimiento: Number(row?.enMantenimiento ?? 0),
      deBaja: Number(row?.deBaja ?? 0),
      valorTotal: Number(row?.valorTotal ?? 0),
    };
  }
}
