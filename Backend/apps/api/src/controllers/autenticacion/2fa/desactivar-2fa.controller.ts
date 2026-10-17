import { Context } from 'hono';
import { desactivar2faSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIdentidad } from '../../../utils/identidad.ts';
import { obtenerIp } from '../../../utils/ip.ts';

export function desactivar2faController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = desactivar2faSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const identidad = obtenerIdentidad(c);
      const { password } = parseResult.data;

      const result = await container.autenticacion.desactivar2FA.execute({
        usuarioId: identidad.usuarioId,
        passwordConfirmacion: password,
        actor: {
          usuarioId: identidad.usuarioId,
          ip: obtenerIp(c),
        },

      });

      return presentResult(c, result);
    } catch (e) {
      console.error('[desactivar2faController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error al desactivar autenticación 2FA' }, 500);
    }
  };
}
