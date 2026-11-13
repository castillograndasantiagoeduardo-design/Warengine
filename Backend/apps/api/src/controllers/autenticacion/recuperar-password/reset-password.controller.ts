import { Context } from 'hono';
import { z } from 'zod';
import { AppContainer } from '@warengine/composition';
import { presentResult } from '../../../presenters/result.presenter.ts';
import { obtenerIp } from '../../../utils/ip.ts';

const resetPasswordSchema = z.object({
  resetToken: z
    .string({ required_error: 'El token de restablecimiento es obligatorio.' })
    .regex(/^[a-fA-F0-9]{64}$/, { message: 'Formato de token de restablecimiento inválido.' }),
  newPassword: z
    .string({ required_error: 'La nueva contraseña es obligatoria.' })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    .max(128, { message: 'La contraseña no puede exceder 128 caracteres.' }),
});

export function resetPasswordController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const parseResult = resetPasswordSchema.safeParse(body);

      if (!parseResult.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: parseResult.error.errors }, 400);
      }

      const { resetToken, newPassword } = parseResult.data;

      const useCaseResult = await container.autenticacion.resetPassword.execute({
        resetToken,
        newPassword,
        ip: obtenerIp(c),
      });

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[resetPasswordController] Error:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error al restablecer la contraseña' }, 500);
    }
  };
}
