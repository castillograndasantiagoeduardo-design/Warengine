import { asc, eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { rol_permisos, permisos, roles } from '../../schema/autenticacion.schema.ts';
import { IRolCatalogoRepository, IRolRepository, RolResumen } from '@warengine/core';

export class DrizzleRolRepository implements IRolRepository, IRolCatalogoRepository {
  constructor(private readonly db: Database) {}

  public async obtenerPermisosDeRol(rolId: number): Promise<string[]> {
    const records = await this.db
      .select({ codigo: permisos.codigo })
      .from(rol_permisos)
      .innerJoin(permisos, eq(rol_permisos.permiso_id, permisos.id_permiso))
      .where(eq(rol_permisos.rol_id, rolId));

    return records.map(r => r.codigo);
  }

  public async obtenerNombreDeRol(rolId: number): Promise<string | null> {
    const [record] = await this.db
      .select({ nombre: roles.nombre })
      .from(roles)
      .where(eq(roles.id_rol, rolId))
      .limit(1);

    return record ? record.nombre : null;
  }

  public async listarRoles(): Promise<RolResumen[]> {
    const records = await this.db
      .select({ id: roles.id_rol, nombre: roles.nombre, descripcion: roles.descripcion })
      .from(roles)
      .orderBy(asc(roles.id_rol));

    return records.map((r) => new RolResumen(r.id, r.nombre, r.descripcion ?? null));
  }
}

