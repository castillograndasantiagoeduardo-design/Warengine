import { eq, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { sucursales } from '../../schema/administracion.schema.ts';
import { DatosSucursal, ISucursalRepository, Sucursal } from '@warengine/core';
import { sucursalFromRow } from '../../mappers/administracion/sucursal.mapper.ts';

export class DrizzleSucursalRepository implements ISucursalRepository {
  constructor(private readonly db: Database) {}

  public async listar(): Promise<Sucursal[]> {
    const rows = await this.db.select().from(sucursales).orderBy(sucursales.nombre);
    return rows.map(sucursalFromRow);
  }

  public async findById(id: number): Promise<Sucursal | null> {
    const [row] = await this.db
      .select()
      .from(sucursales)
      .where(eq(sucursales.id_sucursal, id))
      .limit(1);
    return row ? sucursalFromRow(row) : null;
  }

  public async findByNombre(nombre: string): Promise<Sucursal | null> {
    // Búsqueda case-insensitive: "Sucursal Norte" == "sucursal norte"
    const [row] = await this.db
      .select()
      .from(sucursales)
      .where(sql`LOWER(${sucursales.nombre}) = LOWER(${nombre})`)
      .limit(1);
    return row ? sucursalFromRow(row) : null;
  }

  public async crear(datos: DatosSucursal): Promise<Sucursal> {
    const [resultado] = await this.db.insert(sucursales).values({
      nombre: datos.nombre,
      direccion: datos.direccion ?? null,
      contacto: datos.contacto ?? null,
    });
    return (await this.findById(resultado.insertId)) as Sucursal;
  }

  public async actualizar(
    id: number,
    cambios: Partial<DatosSucursal> & { isActive?: boolean },
  ): Promise<Sucursal> {
    const set: Partial<typeof sucursales.$inferInsert> = {};
    if (cambios.nombre !== undefined) set.nombre = cambios.nombre;
    if (cambios.direccion !== undefined) set.direccion = cambios.direccion;
    if (cambios.contacto !== undefined) set.contacto = cambios.contacto;
    if (cambios.isActive !== undefined) set.is_active = cambios.isActive ? 1 : 0;

    await this.db.update(sucursales).set(set).where(eq(sucursales.id_sucursal, id));
    return (await this.findById(id)) as Sucursal;
  }
}