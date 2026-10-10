import { Context } from 'hono';
import { AppContainer } from '@warengine/composition';
import { clearAuthCookies, getTokensFromCookies } from '../../utils/cookie.ts';

export function logoutController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const { refreshToken } = getTokensFromCookies(c);
      await container.autenticacion.logout.execute({ refreshToken });
    } catch (_e) {
      // Idempotencia: garantiza que siempre se limpien las cookies y devuelva éxito
    } finally {
      clearAuthCookies(c);
    }

    return c.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    }, 200);
  };
}
