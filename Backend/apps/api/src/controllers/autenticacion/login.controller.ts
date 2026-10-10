import { Context } from 'hono';
import { loginSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { setAuthCookies } from '../../utils/cookie.ts';
import { obtenerIp } from '../../utils/ip.ts';

export function loginController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const result = loginSchema.safeParse(body);

      if (!result.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: result.error.errors }, 400);
      }

      const { email, password } = result.data;

      const useCaseResult = await container.autenticacion.login.execute({
        email,
        passwordPlain: password,
        ip: obtenerIp(c),
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
