import { eq, and, gte, count } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { password_reset_tokens } from '../../schema/autenticacion.schema.ts';
import { IPasswordResetRepository, PasswordResetTokenInfo } from '@warengine/core';

async function hashearToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class DrizzlePasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly db: Database) {}

  public async guardar(usuarioId: string, token: string, expiraEn: Date): Promise<void> {
    const tokenHash = await hashearToken(token);
    await this.db.insert(password_reset_tokens).values({
      usuario_id: usuarioId,
      token_hash: tokenHash,
      expira_en: expiraEn,
      usado: 0,
    });
  }

  public async buscarTokenValido(token: string): Promise<PasswordResetTokenInfo | null> {
    const tokenHash = await hashearToken(token);
    const [row] = await this.db
      .select()
      .from(password_reset_tokens)
      .where(eq(password_reset_tokens.token_hash, tokenHash))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id_password_reset_token,
      usuarioId: row.usuario_id,
      expiraEn: row.expira_en,
      usado: row.usado === 1,
    };
  }

  public async marcarComoUsado(id: string): Promise<void> {
    await this.db
      .update(password_reset_tokens)
      .set({ usado: 1 })
      .where(eq(password_reset_tokens.id_password_reset_token, id));
  }

  public async contarSolicitudesRecientesPorUsuario(
    usuarioId: string,
    desde: Date,
  ): Promise<number> {
    // Como cada token expira a los 30 minutos de su creación:
    // createdAt >= desde <=> expira_en >= desde + 30m
    const fechaMinExpira = new Date(desde.getTime() + 30 * 60 * 1000);
    const [res] = await this.db
      .select({ total: count() })
      .from(password_reset_tokens)
      .where(
        and(
          eq(password_reset_tokens.usuario_id, usuarioId),
          gte(password_reset_tokens.expira_en, fechaMinExpira),
        ),
      );

    return Number(res?.total ?? 0);
  }
}
