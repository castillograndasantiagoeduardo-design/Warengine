import { Context } from 'hono';
import { validarTokenPasswordResetSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';

export function validarTokenController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const tokenQuery = c.req.query('token');
      const parseResult = validarTokenPasswordResetSchema.safeParse({ token: tokenQuery });

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const { token } = parseResult.data;

      const useCaseResult = await container.autenticacion.validarTokenPasswordReset.execute({
        token,
      });

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[validarTokenController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error validando el token de recuperación' }, 500);
    }
  };
}
