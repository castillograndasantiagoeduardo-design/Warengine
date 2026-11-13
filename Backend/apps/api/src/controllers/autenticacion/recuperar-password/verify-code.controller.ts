import { Context } from 'hono';
import { z } from 'zod';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIp } from '../../../utils/ip.ts';

const verifyCodeSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Ingresa un correo electrónico válido.' })
    .max(150),
  code: z
    .string({ required_error: 'El código es obligatorio.' })
    .regex(/^\d{4}$/, { message: 'El código debe tener exactamente 4 dígitos numéricos.' }),
});

export function verifyCodeController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = verifyCodeSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const { email, code } = parseResult.data;

      const useCaseResult = await container.autenticacion.verifyCode.execute({
        email,
        code,
        ip: obtenerIp(c),
      });

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[verifyCodeController] Error:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error al verificar el código' }, 500);
    }
  };
}
