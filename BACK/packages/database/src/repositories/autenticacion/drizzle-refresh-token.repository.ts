import { eq, and } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { refresh_tokens } from '../../schema/autenticacion.schema.ts';
import { IRefreshTokenRepository } from '../../../../core/src/autenticacion/domain/repositories/IRefreshTokenRepository.ts';

export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Database) {}

  public async guardar(usuarioId: string, token: string, expiraEn: Date): Promise<void> {
    await this.db.insert(refresh_tokens).values({
      usuario_id: usuarioId,
      token_hash: token,
      expira_en: expiraEn,
      revocado: 0
    });
  }

  public async validar(token: string): Promise<{ usuarioId: string } | null> {
    const [rt] = await this.db.select()
      .from(refresh_tokens)
      .where(and(
        eq(refresh_tokens.token_hash, token),
        eq(refresh_tokens.revocado, 0)
      ))
      .limit(1);

    if (!rt) return null;
    if (new Date() > rt.expira_en) return null;

    return { usuarioId: rt.usuario_id };
  }

  public async revocar(token: string): Promise<void> {
    await this.db.update(refresh_tokens)
      .set({ revocado: 1 })
      .where(eq(refresh_tokens.token_hash, token));
  }
}
