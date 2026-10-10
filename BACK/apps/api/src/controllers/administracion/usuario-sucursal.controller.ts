import { asignarSucursalesSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function obtenerSucursalesUsuarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const usuarioId = c.req.param('id');
    if (!usuarioId) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de usuario inválido.' }, 400);
    }
    return presentResult(
      c,
      await container.administracion.obtenerSucursalesUsuario.execute({ usuarioId }),
    );
  });
}

export function asignarSucursalesUsuarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const usuarioId = c.req.param('id');
    if (!usuarioId) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'Id de usuario inválido.' }, 400);
    }
    const parsed = asignarSucursalesSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const result = await container.administracion.asignarSucursalesUsuario.execute({
      usuarioId,
      sucursalPrincipalId: parsed.data.sucursalPrincipalId,
      sucursalesAdicionalesIds: parsed.data.sucursalesAdicionalesIds,
      actor: obtenerActor(c),
    });
    return presentResult(c, result);
  });
}