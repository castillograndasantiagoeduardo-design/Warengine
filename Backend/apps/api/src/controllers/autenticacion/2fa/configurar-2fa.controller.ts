import { Context } from 'hono';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIdentidad } from '../../../utils/identidad.ts';

export function configurar2faController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const identidad = obtenerIdentidad(c);
      const result = await container.autenticacion.configurar2FA.execute({
        usuarioId: identidad.usuarioId,
      });

      return presentResult(c, result);
    } catch (e) {
      console.error('[configurar2faController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error al generar configuración de 2FA' }, 500);
    }
  };
}
