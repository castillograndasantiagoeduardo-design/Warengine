import { eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { IUsuarioRepository, Usuario } from '@warengine/core';
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

  public async actualizarTotp(usuarioId: string, totpSecret: string | null, requiere2fa: boolean): Promise<void> {
    await this.db
      .update(usuarios)
      .set({
        totp_secret: totpSecret,
        requiere_2fa: requiere2fa ? 1 : 0,
      })
      .where(eq(usuarios.id_usuario, usuarioId));
  }

  public async actualizarPassword(
    usuarioId: string,
    nuevoPasswordHash: string,
    tokensInvalidadosEn: Date,
  ): Promise<void> {
    await this.db
      .update(usuarios)
      .set({
        password_hash: nuevoPasswordHash,
        tokens_invalidados_en: tokensInvalidadosEn,
      })
      .where(eq(usuarios.id_usuario, usuarioId));
  }
}

