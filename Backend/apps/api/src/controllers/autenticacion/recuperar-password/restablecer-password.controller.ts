import { Context } from 'hono';
import { confirmarRestablecerPasswordSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIp } from '../../../utils/ip.ts';

export function restablecerPasswordController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = confirmarRestablecerPasswordSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const { token, nuevaPassword, confirmarPassword } = parseResult.data;

      const useCaseResult = await container.autenticacion.restablecerPassword.execute({
        token,
        nuevaPassword,
        confirmarPassword,
        ip: obtenerIp(c),
      });

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[restablecerPasswordController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando el restablecimiento de contraseña' }, 500);
    }
  };
}
