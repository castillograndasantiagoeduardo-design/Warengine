import { Context } from 'hono';
import { verificar2faLoginSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { setAuthCookies } from '../../../utils/cookie.ts';
import { obtenerIp } from '../../../utils/ip.ts';

export function verificar2faLoginController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = verificar2faLoginSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const { tempToken, codigoTotp, recordarme } = parseResult.data;

      const useCaseResult = await container.autenticacion.verificar2FALogin.execute({
        tempToken,
        codigoTotp,
        ip: obtenerIp(c),
        recordarme,
      });

      if (useCaseResult.isSuccess) {
        setAuthCookies(c, useCaseResult.value, recordarme);
      }

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[verificar2faLoginController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando la verificación 2FA' }, 500);
    }
  };
}
