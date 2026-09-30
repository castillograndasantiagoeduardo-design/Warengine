import { eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { rol_permisos, permisos } from '../../schema/autenticacion.schema.ts';
import { IRolRepository } from '../../../../core/src/autenticacion/domain/repositories/IRolRepository.ts';

export class DrizzleRolRepository implements IRolRepository {
  constructor(private readonly db: Database) {}

  public async obtenerPermisosDeRol(rolId: number): Promise<string[]> {
    const records = await this.db
      .select({ codigo: permisos.codigo })
      .from(rol_permisos)
      .innerJoin(permisos, eq(rol_permisos.permiso_id, permisos.id_permiso))
      .where(eq(rol_permisos.rol_id, rolId));

    return records.map(r => r.codigo);
  }
}
