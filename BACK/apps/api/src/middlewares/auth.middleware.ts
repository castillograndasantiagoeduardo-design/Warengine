import { Context, Next } from 'hono';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../presenters/result.presenter.ts';

export function authMiddleware(container: AppContainer, permisoRequerido?: string) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Falta token de autorización' }, 401);
    }

    const token = authHeader.split(' ')[1];

    const result = await container.autenticacion.validarPermiso.execute({
      accessToken: token,
      permisoRequerido
    });

    if (result.isFailure) {
      return presentResult(c, result);
    }

    // Token válido, procedemos al controlador
    await next();
  };
}
