import { Context } from 'hono';
import { z } from 'zod';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIp } from '../../../utils/ip.ts';

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Ingresa un correo electrónico válido.' })
    .max(150, { message: 'El correo electrónico no puede exceder 150 caracteres.' }),
});

export function forgotPasswordController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = forgotPasswordSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const { email } = parseResult.data;

      const useCaseResult = await container.autenticacion.forgotPassword.execute({
        email,
        ip: obtenerIp(c),
      });

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[forgotPasswordController] Error:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando la solicitud de recuperación' }, 500);
    }
  };
}
