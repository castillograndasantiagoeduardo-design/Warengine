import { eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { empleados } from '../../schema/administracion.schema.ts';
import { refresh_tokens, usuario_sucursales, usuarios } from '../../schema/autenticacion.schema.ts';
import { IUsuarioSucursalRepository } from '@warengine/core';

export class DrizzleUsuarioSucursalRepository implements IUsuarioSucursalRepository {
  constructor(private readonly db: Database) {}

  public async obtenerIdsAdicionales(usuarioId: string): Promise<number[]> {
    const rows = await this.db
      .select({ id: usuario_sucursales.sucursal_id })
      .from(usuario_sucursales)
      .where(eq(usuario_sucursales.usuario_id, usuarioId))
      .orderBy(usuario_sucursales.sucursal_id);
    return rows.map((row) => row.id);
  }

  public async reemplazarSucursales(
    usuarioId: string,
    sucursalPrincipalId: number,
    sucursalesAdicionalesIds: number[],
    invalidarTokensEn: Date,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [usuario] = await tx
        .select({ empleadoId: usuarios.empleado_id })
        .from(usuarios)
        .where(eq(usuarios.id_usuario, usuarioId))
        .limit(1);
      if (!usuario) throw new Error('Usuario inexistente al reemplazar sus sucursales.');

      await tx
        .update(empleados)
        .set({ sucursal_id: sucursalPrincipalId })
        .where(eq(empleados.id_empleado, usuario.empleadoId));

      await tx.delete(usuario_sucursales).where(eq(usuario_sucursales.usuario_id, usuarioId));
      if (sucursalesAdicionalesIds.length > 0) {
        await tx.insert(usuario_sucursales).values(
          sucursalesAdicionalesIds.map((sucursal_id) => ({ usuario_id: usuarioId, sucursal_id })),
        );
      }

      // Los triggers de usuario_sucursales ya invalidan tokens, pero cambiar solo la principal
      // (empleados.sucursal_id) no dispara ninguno: se marca aquí siempre (RF-SA-D11).
      await tx
        .update(usuarios)
        .set({ tokens_invalidados_en: invalidarTokensEn })
        .where(eq(usuarios.id_usuario, usuarioId));
      await tx
        .update(refresh_tokens)
        .set({ revocado: 1 })
        .where(eq(refresh_tokens.usuario_id, usuarioId));
    });
  }
}