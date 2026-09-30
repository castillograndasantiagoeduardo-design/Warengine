import { Context } from 'hono';
import { renovarTokenSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';

export function renovarTokenController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const result = renovarTokenSchema.safeParse(body);
      
      if (!result.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: result.error.errors }, 400);
      }

      const useCaseResult = await container.autenticacion.renovarToken.execute({
        refreshToken: result.data.refreshToken
      });

      return presentResult(c, useCaseResult);
    } catch (e) {
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando la solicitud' }, 500);
    }
  };
}
