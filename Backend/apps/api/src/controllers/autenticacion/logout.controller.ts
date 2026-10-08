import { Context } from 'hono';
import { AppContainer } from '@warengine/composition';
import { clearAuthCookies, getTokensFromCookies } from '../../utils/cookie.ts';

export function logoutController(container: AppContainer) {
  return async (c: Context) => {
    try {
      let refreshToken = getTokensFromCookies(c).refreshToken;

      // Soporte complementario para clientes HTTP/REST que envían el token en body
      if (!refreshToken) {
        try {
          const body = await c.req.json();
          if (body && typeof body.refreshToken === 'string') {
            refreshToken = body.refreshToken;
          }
        } catch {
          // Body vacío o no parseable
        }
      }

      await container.autenticacion.logout.execute({
        refreshToken,
      });

      clearAuthCookies(c);

      return c.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      }, 200);
    } catch (_e) {
      // SIEMPRE limpia las cookies y responde 200 incluso ante fallos inesperados
      clearAuthCookies(c);
      return c.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      }, 200);
    }
  };
}
