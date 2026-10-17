import { Context } from 'hono';
import { activar2faSchema } from '@warengine/contracts';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIdentidad } from '../../../utils/identidad.ts';
import { obtenerIp } from '../../../utils/ip.ts';

export function activar2faController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = activar2faSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const identidad = obtenerIdentidad(c);
      const { secretBase32, codigoTotp } = parseResult.data;

      const result = await container.autenticacion.activar2FA.execute({
        usuarioId: identidad.usuarioId,
        secretBase32,
        codigoTotp,
        actor: {
          usuarioId: identidad.usuarioId,
          ip: obtenerIp(c),
        },

      });

      return presentResult(c, result);
    } catch (e) {
      console.error('[activar2faController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error al activar autenticación 2FA' }, 500);
    }
  };
}
