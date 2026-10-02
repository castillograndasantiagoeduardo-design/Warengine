import { Context } from 'hono';
import { clearAuthCookies } from '../../utils/cookie.ts';

export function logoutController() {
  return (c: Context) => {
    clearAuthCookies(c);
    return c.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    }, 200);
  };
}
