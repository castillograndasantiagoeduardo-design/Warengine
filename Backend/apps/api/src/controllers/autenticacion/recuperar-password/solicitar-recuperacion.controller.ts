import { Context } from 'hono';
import { solicitarRecuperacionPasswordSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIp } from '../../../utils/ip.ts';

export function solicitarRecuperacionController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = solicitarRecuperacionPasswordSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const { email } = parseResult.data;

      const useCaseResult = await container.autenticacion.solicitarRecuperacionPassword.execute({
        email,
        ip: obtenerIp(c),
      });

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[solicitarRecuperacionController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando la solicitud de recuperación' }, 500);
    }
  };
}
