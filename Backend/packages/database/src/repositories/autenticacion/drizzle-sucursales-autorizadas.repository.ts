import { eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { empleados } from '../../schema/administracion.schema.ts';
import { usuario_sucursales, usuarios } from '../../schema/autenticacion.schema.ts';
import { ISucursalesAutorizadasRepository } from '@warengine/core';

export class DrizzleSucursalesAutorizadasRepository implements ISucursalesAutorizadasRepository {
  constructor(private readonly db: Database) {}

  public async obtenerIdsAutorizados(usuarioId: string): Promise<number[]> {
    const [principal] = await this.db
      .select({ id: empleados.sucursal_id })
      .from(usuarios)
      .innerJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(eq(usuarios.id_usuario, usuarioId))
      .limit(1);

    const adicionales = await this.db
      .select({ id: usuario_sucursales.sucursal_id })
      .from(usuario_sucursales)
      .where(eq(usuario_sucursales.usuario_id, usuarioId));

    const ids = [...(principal ? [principal.id] : []), ...adicionales.map((fila) => fila.id)];
    return [...new Set(ids)].sort((a, b) => a - b);
  }
}