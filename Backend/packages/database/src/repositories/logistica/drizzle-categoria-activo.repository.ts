import { and, count, eq, like, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { categoriasActivos } from '../../schema/logistica.schema.ts';
import {
  CategoriaActivo,
  ICategoriaActivoRepository,
  FiltrosListarCategoriasActivos,
  ResultadoPaginado,
} from '@warengine/core';
import { categoriaActivoFromRow } from '../../mappers/logistica/categoria-activo.mapper.ts';

export class DrizzleCategoriaActivoRepository implements ICategoriaActivoRepository {
  constructor(private readonly db: Database) {}

  public async listar(filtros: FiltrosListarCategoriasActivos): Promise<ResultadoPaginado<CategoriaActivo>> {
    const condiciones: SQL[] = [];
    if (filtros.busqueda) {
      condiciones.push(like(categoriasActivos.nombre, `%${filtros.busqueda}%`));
    }
    if (filtros.isActive !== undefined) {
      condiciones.push(eq(categoriasActivos.is_active, filtros.isActive ? 1 : 0));
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(categoriasActivos)
      .where(whereClause);

    const limit = Math.max(1, filtros.limit);
    const page = Math.max(1, filtros.page);
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(categoriasActivos)
      .where(whereClause)
      .orderBy(categoriasActivos.nombre)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map(categoriaActivoFromRow),
      total: Number(total),
      page,
      limit,
      totalPages,
    };
  }

  public async findById(id: number): Promise<CategoriaActivo | null> {
    const [row] = await this.db
      .select()
      .from(categoriasActivos)
      .where(eq(categoriasActivos.id_categoria_activo, id))
      .limit(1);
    return row ? categoriaActivoFromRow(row) : null;
  }

  public async findByNombre(nombre: string): Promise<CategoriaActivo | null> {
    const [row] = await this.db
      .select()
      .from(categoriasActivos)
      .where(sql`LOWER(TRIM(${categoriasActivos.nombre})) = LOWER(TRIM(${nombre}))`)
      .limit(1);
    return row ? categoriaActivoFromRow(row) : null;
  }

  public async crear(datos: { nombre: string }): Promise<CategoriaActivo> {
    const [res] = await this.db.insert(categoriasActivos).values({
      nombre: datos.nombre,
      is_active: 1,
    });
    return (await this.findById(res.insertId)) as CategoriaActivo;
  }

  public async actualizar(id: number, cambios: { nombre: string }): Promise<CategoriaActivo> {
    await this.db
      .update(categoriasActivos)
      .set({ nombre: cambios.nombre })
      .where(eq(categoriasActivos.id_categoria_activo, id));
    return (await this.findById(id)) as CategoriaActivo;
  }

  public async cambiarEstado(id: number, isActive: boolean): Promise<CategoriaActivo> {
    await this.db
      .update(categoriasActivos)
      .set({ is_active: isActive ? 1 : 0 })
      .where(eq(categoriasActivos.id_categoria_activo, id));
    return (await this.findById(id)) as CategoriaActivo;
  }
}
