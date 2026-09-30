import { eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { IUsuarioRepository } from '../../../../core/src/autenticacion/domain/repositories/IUsuarioRepository.ts';
import { Usuario } from '../../../../core/src/autenticacion/domain/entities/Usuario.ts';
import { fromRow } from '../../mappers/autenticacion/usuario.mapper.ts';

export class DrizzleUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly db: Database) {}

  public async findByEmail(email: string): Promise<Usuario | null> {
    const [row] = await this.db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
    if (!row) return null;
    return fromRow(row);
  }

  public async findById(id: string): Promise<Usuario | null> {
    const [row] = await this.db.select().from(usuarios).where(eq(usuarios.id_usuario, id)).limit(1);
    if (!row) return null;
    return fromRow(row);
  }
}
