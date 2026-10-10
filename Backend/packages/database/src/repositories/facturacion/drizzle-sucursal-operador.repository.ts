import { eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { empleados } from '../../schema/administracion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { ISucursalOperadorRepository } from '@warengine/core';

export class DrizzleSucursalOperadorRepository implements ISucursalOperadorRepository {
    constructor(private readonly db: Database) { }

    public async obtenerSucursalId(usuarioId: string): Promise<number | null> {
        const [row] = await this.db
            .select({ sucursalId: empleados.sucursal_id })
            .from(usuarios)
            .innerJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
            .where(eq(usuarios.id_usuario, usuarioId))
            .limit(1);
        return row?.sucursalId ?? null;
    }
}