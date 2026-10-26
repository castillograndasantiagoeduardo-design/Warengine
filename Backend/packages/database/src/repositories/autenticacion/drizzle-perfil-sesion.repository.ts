import { eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { empleados, sucursales } from '../../schema/administracion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { IPerfilSesionRepository, PerfilSesion } from '@warengine/core';

export class DrizzlePerfilSesionRepository implements IPerfilSesionRepository {
  constructor(private readonly db: Database) {}

  public async obtenerPerfil(usuarioId: string): Promise<PerfilSesion | null> {
    const [fila] = await this.db
      .select({
        nombre: empleados.nombre,
        sucursalId: empleados.sucursal_id,
        sucursalNombre: sucursales.nombre,
      })
      .from(usuarios)
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .leftJoin(sucursales, eq(empleados.sucursal_id, sucursales.id_sucursal))
      .where(eq(usuarios.id_usuario, usuarioId))
      .limit(1);

    if (!fila) return null;
    return {
      nombre: fila.nombre ?? null,
      sucursalId: fila.sucursalId ?? null,
      sucursalNombre: fila.sucursalNombre ?? null,
    };
  }
}
