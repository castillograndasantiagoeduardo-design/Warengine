import { eq, and, desc, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { password_reset_tokens } from '../../schema/autenticacion.schema.ts';
import {
  IPasswordResetRepository,
  PasswordResetTokenInfo,
  PasswordResetOtpRecord,
  ResultadoVerificacionOtp,
} from '@warengine/core';

async function hashearToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class DrizzlePasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly db: Database) {}

  public async obtenerUltimaSolicitudPorEmail(email: string): Promise<PasswordResetOtpRecord | null> {
    const emailNorm = email.trim().toLowerCase();
    const [row] = await this.db
      .select()
      .from(password_reset_tokens)
      .where(eq(password_reset_tokens.email, emailNorm))
      .orderBy(desc(password_reset_tokens.created_at))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      usuarioId: row.id_usuario,
      email: row.email,
      codeHash: row.code_hash,
      attempts: row.attempts,
      expiresAt: row.expires_at,
      resetTokenHash: row.reset_token_hash,
      resetTokenExpiresAt: row.reset_token_expires_at,
      used: row.used === 1,
      createdAt: row.created_at,
    };
  }

  public async guardarOtp(
    usuarioId: string,
    email: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<number> {
    const emailNorm = email.trim().toLowerCase();

    // Invalida solicitudes previas pendientes
    await this.db
      .update(password_reset_tokens)
      .set({ used: 1 })
      .where(and(eq(password_reset_tokens.email, emailNorm), eq(password_reset_tokens.used, 0)));

    const result = await this.db.insert(password_reset_tokens).values({
      id_usuario: usuarioId,
      email: emailNorm,
      code_hash: codeHash,
      attempts: 0,
      expires_at: expiresAt,
      used: 0,
    });

    const insertId = Number((result as unknown as [{ insertId: number }])[0]?.insertId ?? 0);
    return insertId;
  }

  public async verificarOtpConLock(
    email: string,
    verificador: (hashGuardado: string) => boolean,
  ): Promise<ResultadoVerificacionOtp> {
    const emailNorm = email.trim().toLowerCase();

    return await this.db.transaction(async (tx) => {
      // Bloqueo de fila exclusivo SELECT ... FOR UPDATE en MySQL para evitar carreras en intentos
      const [row] = await tx
        .select()
        .from(password_reset_tokens)
        .where(eq(password_reset_tokens.email, emailNorm))
        .orderBy(desc(password_reset_tokens.created_at))
        .limit(1)
        .for('update');

      if (!row) {
        return { exito: false, motivo: 'NO_ENCONTRADO' };
      }

      if (row.used === 1) {
        return { exito: false, motivo: 'YA_USADO' };
      }

      if (row.attempts >= 5) {
        return { exito: false, motivo: 'BLOQUEADO' };
      }

      const ahora = new Date();
      if (ahora > row.expires_at) {
        return { exito: false, motivo: 'EXPIRADO' };
      }

      if (!row.code_hash) {
        return { exito: false, motivo: 'NO_ENCONTRADO' };
      }

      const esCorrecto = verificador(row.code_hash);

      if (!esCorrecto) {
        const nuevosIntentos = row.attempts + 1;
        await tx
          .update(password_reset_tokens)
          .set({ attempts: nuevosIntentos })
          .where(eq(password_reset_tokens.id, row.id));

        if (nuevosIntentos >= 5) {
          return { exito: false, motivo: 'BLOQUEADO', intentosRestantes: 0 };
        }

        return {
          exito: false,
          motivo: 'CODIGO_INCORRECTO',
          intentosRestantes: Math.max(0, 5 - nuevosIntentos),
        };
      }

      // Código correcto: se mantiene válida la fila para asociar el resetToken
      return {
        exito: true,
        resetId: row.id,
        usuarioId: row.id_usuario,
      };
    });
  }

  public async asignarResetToken(
    id: number,
    resetTokenHash: string,
    resetTokenExpiresAt: Date,
  ): Promise<void> {
    await this.db
      .update(password_reset_tokens)
      .set({
        reset_token_hash: resetTokenHash,
        reset_token_expires_at: resetTokenExpiresAt,
      })
      .where(eq(password_reset_tokens.id, id));
  }

  public async buscarPorResetTokenHash(
    resetTokenHash: string,
  ): Promise<PasswordResetOtpRecord | null> {
    const [row] = await this.db
      .select()
      .from(password_reset_tokens)
      .where(
        and(
          eq(password_reset_tokens.reset_token_hash, resetTokenHash),
          eq(password_reset_tokens.used, 0),
        ),
      )
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      usuarioId: row.id_usuario,
      email: row.email,
      codeHash: row.code_hash,
      attempts: row.attempts,
      expiresAt: row.expires_at,
      resetTokenHash: row.reset_token_hash,
      resetTokenExpiresAt: row.reset_token_expires_at,
      used: row.used === 1,
      createdAt: row.created_at,
    };
  }

  public async marcarTodosComoUsadosPorUsuario(usuarioId: string): Promise<void> {
    await this.db
      .update(password_reset_tokens)
      .set({ used: 1 })
      .where(eq(password_reset_tokens.id_usuario, usuarioId));
  }

  // ─── Compatibilidad hacia atrás ───────────────────────────────────────────
  public async guardar(usuarioId: string, token: string, expiraEn: Date): Promise<void> {
    const tokenHash = await hashearToken(token);
    await this.db.insert(password_reset_tokens).values({
      id_usuario: usuarioId,
      email: 'legacy@warengine.local',
      reset_token_hash: tokenHash,
      expires_at: expiraEn,
      reset_token_expires_at: expiraEn,
      used: 0,
    });
  }

  public async buscarTokenValido(token: string): Promise<PasswordResetTokenInfo | null> {
    const tokenHash = await hashearToken(token);
    const row = await this.buscarPorResetTokenHash(tokenHash);
    if (!row) return null;
    return {
      id: String(row.id),
      usuarioId: row.usuarioId,
      expiraEn: row.resetTokenExpiresAt ?? row.expiresAt,
      usado: row.used,
    };
  }

  public async marcarComoUsado(id: string | number): Promise<void> {
    await this.db
      .update(password_reset_tokens)
      .set({ used: 1 })
      .where(eq(password_reset_tokens.id, Number(id)));
  }

  public async contarSolicitudesRecientesPorUsuario(
    usuarioId: string,
    desde: Date,
  ): Promise<number> {
    const [res] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(password_reset_tokens)
      .where(
        and(
          eq(password_reset_tokens.id_usuario, usuarioId),
          sql`${password_reset_tokens.created_at} >= ${desde}`,
        ),
      );

    return Number(res?.total ?? 0);
  }
}
