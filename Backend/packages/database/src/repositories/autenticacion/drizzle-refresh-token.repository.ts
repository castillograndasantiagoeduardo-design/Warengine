import { eq, and } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { refresh_tokens } from '../../schema/autenticacion.schema.ts';
import { IRefreshTokenRepository } from '@warengine/core';

/**
 * Calcula el hash SHA-256 en formato hexadecimal de un token usando la Web Crypto API.
 */
async function hashearToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Database) {}

  public async guardar(usuarioId: string, token: string, expiraEn: Date): Promise<void> {
    const tokenHash = await hashearToken(token);
    await this.db.insert(refresh_tokens).values({
      usuario_id: usuarioId,
      token_hash: tokenHash,
      expira_en: expiraEn,
      revocado: 0,
    });
  }

  public async validar(token: string): Promise<{ usuarioId: string } | null> {
    const tokenHash = await hashearToken(token);
    const [rt] = await this.db.select()
      .from(refresh_tokens)
      .where(and(
        eq(refresh_tokens.token_hash, tokenHash),
        eq(refresh_tokens.revocado, 0),
      ))
      .limit(1);

    if (!rt) return null;
    if (new Date() > rt.expira_en) return null;

    return { usuarioId: rt.usuario_id };
  }

  public async revocar(token: string): Promise<void> {
    const tokenHash = await hashearToken(token);
    await this.db.update(refresh_tokens)
      .set({ revocado: 1 })
      .where(eq(refresh_tokens.token_hash, tokenHash));
  }
}
