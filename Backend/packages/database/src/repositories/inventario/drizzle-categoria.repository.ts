import { and, count, eq, like, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { categorias } from '../../schema/inventario.schema.ts';
import {
  Categoria,
  DatosActualizarCategoria,
  DatosCrearCategoria,
  FiltrosListarCategorias,
  ICategoriaRepository,
  ResultadoPaginado,
} from '@warengine/core';
import { categoriaFromRow } from '../../mappers/inventario/categoria.mapper.ts';

export class DrizzleCategoriaRepository implements ICategoriaRepository {
  constructor(private readonly db: Database) {}

  public async listar(filtros: FiltrosListarCategorias): Promise<ResultadoPaginado<Categoria>> {
    const condiciones: SQL[] = [];
    if (filtros.busqueda) {
      condiciones.push(like(categorias.nombre, `%${filtros.busqueda}%`));
    }
    if (filtros.isActive !== undefined) {
      condiciones.push(eq(categorias.is_active, filtros.isActive ? 1 : 0));
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(categorias)
      .where(whereClause);

    const limit = Math.max(1, filtros.limit);
    const page = Math.max(1, filtros.page);
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(categorias)
      .where(whereClause)
      .orderBy(categorias.nombre)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map(categoriaFromRow),
      total: Number(total),
      page,
      limit,
      totalPages,
    };
  }

  public async listarActivos(): Promise<Categoria[]> {
    const rows = await this.db
      .select()
      .from(categorias)
      .where(eq(categorias.is_active, 1))
      .orderBy(categorias.nombre);
    return rows.map(categoriaFromRow);
  }

  public async findById(id: number): Promise<Categoria | null> {
    const [row] = await this.db
      .select()
      .from(categorias)
      .where(eq(categorias.id_categoria, id))
      .limit(1);
    return row ? categoriaFromRow(row) : null;
  }

  public async crear(datos: DatosCrearCategoria): Promise<Categoria> {
    const [resultado] = await this.db.insert(categorias).values({
      nombre: datos.nombre,
      is_active: 1,
    });
    return (await this.findById(resultado.insertId)) as Categoria;
  }

  public async actualizar(
    id: number,
    cambios: DatosActualizarCategoria,
  ): Promise<Categoria> {
    const set: Partial<typeof categorias.$inferInsert> = {};
    if (cambios.nombre !== undefined) set.nombre = cambios.nombre;
    if (cambios.isActive !== undefined) set.is_active = cambios.isActive ? 1 : 0;

    if (Object.keys(set).length > 0) {
      await this.db.update(categorias).set(set).where(eq(categorias.id_categoria, id));
    }
    return (await this.findById(id)) as Categoria;
  }

  public async cambiarEstado(id: number, isActive: boolean): Promise<Categoria> {
    await this.db
      .update(categorias)
      .set({ is_active: isActive ? 1 : 0 })
      .where(eq(categorias.id_categoria, id));
    return (await this.findById(id)) as Categoria;
  }
}
