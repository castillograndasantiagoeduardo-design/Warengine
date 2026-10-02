import { Context } from 'hono';
import { renovarTokenSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { getTokensFromCookies, setAuthCookies } from '../../utils/cookie.ts';

export function renovarTokenController(container: AppContainer) {
  return async (c: Context) => {
    try {
      // 1. Intentar obtener el refreshToken del body JSON o de las cookies
      let tokenValue: string | undefined = undefined;

      try {
        const body = await c.req.json();
        const result = renovarTokenSchema.safeParse(body);
        if (result.success) {
          tokenValue = result.data.refreshToken;
        }
      } catch (_e) {
        // El body puede estar vacío si el navegador envía la cookie automáticamente
      }

      if (!tokenValue) {
        tokenValue = getTokensFromCookies(c).refreshToken;
      }

      if (!tokenValue) {
        return c.json({
          error: 'VALIDATION_ERROR',
          message: 'El refresh token es obligatorio (en cookie o en body)'
        }, 400);
      }

      const useCaseResult = await container.autenticacion.renovarToken.execute({
        refreshToken: tokenValue
      });

      if (useCaseResult.isSuccess) {
        setAuthCookies(c, useCaseResult.value);
      }

      return presentResult(c, useCaseResult);
    } catch (_e) {
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando la solicitud' }, 500);
    }
  };
}
