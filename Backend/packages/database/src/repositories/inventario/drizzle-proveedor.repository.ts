import { and, count, eq, like, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { proveedores } from '../../schema/inventario.schema.ts';
import {
  DatosActualizarProveedor,
  DatosCrearProveedor,
  FiltrosListarProveedores,
  IProveedorRepository,
  Proveedor,
  ResultadoPaginado,
} from '@warengine/core';
import { proveedorFromRow } from '../../mappers/inventario/proveedor.mapper.ts';

export class DrizzleProveedorRepository implements IProveedorRepository {
  constructor(private readonly db: Database) {}

  public async listar(filtros: FiltrosListarProveedores): Promise<ResultadoPaginado<Proveedor>> {
    const condiciones: SQL[] = [];
    if (filtros.busqueda) {
      condiciones.push(like(proveedores.nombre, `%${filtros.busqueda}%`));
    }
    if (filtros.isActive !== undefined) {
      condiciones.push(eq(proveedores.is_active, filtros.isActive ? 1 : 0));
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(proveedores)
      .where(whereClause);

    const limit = Math.max(1, filtros.limit);
    const page = Math.max(1, filtros.page);
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(proveedores)
      .where(whereClause)
      .orderBy(proveedores.nombre)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map(proveedorFromRow),
      total: Number(total),
      page,
      limit,
      totalPages,
    };
  }

  public async listarActivos(): Promise<Proveedor[]> {
    const rows = await this.db
      .select()
      .from(proveedores)
      .where(eq(proveedores.is_active, 1))
      .orderBy(proveedores.nombre);
    return rows.map(proveedorFromRow);
  }

  public async findById(id: number): Promise<Proveedor | null> {
    const [row] = await this.db
      .select()
      .from(proveedores)
      .where(eq(proveedores.id_proveedor, id))
      .limit(1);
    return row ? proveedorFromRow(row) : null;
  }

  public async crear(datos: DatosCrearProveedor): Promise<Proveedor> {
    const [resultado] = await this.db.insert(proveedores).values({
      nombre: datos.nombre,
      contacto: datos.contacto ?? null,
      is_active: 1,
    });
    return (await this.findById(resultado.insertId)) as Proveedor;
  }

  public async actualizar(
    id: number,
    cambios: DatosActualizarProveedor,
  ): Promise<Proveedor> {
    const set: Partial<typeof proveedores.$inferInsert> = {};
    if (cambios.nombre !== undefined) set.nombre = cambios.nombre;
    if (cambios.contacto !== undefined) set.contacto = cambios.contacto;
    if (cambios.isActive !== undefined) set.is_active = cambios.isActive ? 1 : 0;

    if (Object.keys(set).length > 0) {
      await this.db.update(proveedores).set(set).where(eq(proveedores.id_proveedor, id));
    }
    return (await this.findById(id)) as Proveedor;
  }

  public async cambiarEstado(id: number, isActive: boolean): Promise<Proveedor> {
    await this.db
      .update(proveedores)
      .set({ is_active: isActive ? 1 : 0 })
      .where(eq(proveedores.id_proveedor, id));
    return (await this.findById(id)) as Proveedor;
  }
}
