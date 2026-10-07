import { Context, Next } from 'hono';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../presenters/result.presenter.ts';
import { getTokensFromCookies } from '../utils/cookie.ts';
import { CLAVE_IDENTIDAD } from '../utils/identidad.ts';

export function authMiddleware(container: AppContainer, permisoRequerido?: string) {
  return async (c: Context, next: Next) => {
    // 1. Prioridad: leer desde cookie HttpOnly
    let token = getTokensFromCookies(c).accessToken;

    // 2. Respaldo: leer desde cabecera Authorization: Bearer <token>
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Falta token de autorización' }, 401);
    }

    const result = await container.autenticacion.validarPermiso.execute({
      accessToken: token,
      permisoRequerido
    });

    if (result.isFailure) {
      return presentResult(c, result);
    }

    // Token válido: dejamos la identidad disponible para los controladores
    // (se lee con obtenerIdentidad(c) en utils/identidad.ts).
    c.set(CLAVE_IDENTIDAD, result.value);

    await next();
  };
}