import { and, count, eq, exists, inArray, isNull, like, or, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { activos, categoriasActivos, asignacionesActivos } from '../../schema/logistica.schema.ts';
import {
  Activo,
  DatosCrearActivo,
  FiltrosListarActivos,
  IActivoRepository,
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

  public async marcarBaja(id: string): Promise<Activo> {
    await this.db
      .update(activos)
      .set({ estado: 'baja', is_active: 0 })
      .where(eq(activos.id_activo, id));
    return (await this.findById(id)) as Activo;
  }
}
