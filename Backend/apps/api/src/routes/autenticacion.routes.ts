import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { loginController } from '../controllers/autenticacion/login.controller.ts';
import { renovarTokenController } from '../controllers/autenticacion/renovar-token.controller.ts';
import { logoutController } from '../controllers/autenticacion/logout.controller.ts';
import { configurar2faController } from '../controllers/autenticacion/2fa/configurar-2fa.controller.ts';
import { activar2faController } from '../controllers/autenticacion/2fa/activar-2fa.controller.ts';
import { verificar2faLoginController } from '../controllers/autenticacion/2fa/verificar-2fa-login.controller.ts';
import { desactivar2faController } from '../controllers/autenticacion/2fa/desactivar-2fa.controller.ts';
import { solicitarRecuperacionController } from '../controllers/autenticacion/recuperar-password/solicitar-recuperacion.controller.ts';
import { validarTokenController } from '../controllers/autenticacion/recuperar-password/validar-token.controller.ts';
import { restablecerPasswordController } from '../controllers/autenticacion/recuperar-password/restablecer-password.controller.ts';
import { forgotPasswordController } from '../controllers/autenticacion/recuperar-password/forgot-password.controller.ts';
import { verifyCodeController } from '../controllers/autenticacion/recuperar-password/verify-code.controller.ts';
import { resetPasswordController } from '../controllers/autenticacion/recuperar-password/reset-password.controller.ts';
import { createIpRateLimiter } from '../middlewares/rate-limit.middleware.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { obtenerIdentidad } from '../utils/identidad.ts';
import { safeHandler } from '../utils/handler.ts';
import { presentResult } from '../presenters/result.presenter.ts';

export function createAutenticacionRoutes(container: AppContainer): Hono {
  const api = new Hono();

  // Flujo base de autenticación
  api.post('/login', loginController(container));
  api.post('/renovar-token', renovarTokenController(container));
  api.post('/logout', logoutController(container));

  // Verificación de sesión e identidad (RF-SA-D5)
  api.get('/verificar', authMiddleware(container), safeHandler(async (c) => {
    const identidad = obtenerIdentidad(c);
    const sesion = await container.autenticacion.obtenerSesionActual.execute({
      usuarioId: identidad.usuarioId,
    });
    if (sesion.isFailure) return presentResult(c, sesion);

    return c.json({
      ok: true,
      message: 'Sesión activa y autenticada correctamente',
      usuarioId: identidad.usuarioId,
      rolId: identidad.rolId,
      permisos: identidad.permisos,
      usuario: sesion.value.usuario,
    });
  }));

  // Doble factor de autenticación (2FA TOTP - RF-SA-D12)
  api.post('/2fa/configurar', authMiddleware(container), configurar2faController(container));
  api.post('/2fa/activar', authMiddleware(container), activar2faController(container));
  api.post('/2fa/verificar', verificar2faLoginController(container));
  api.post('/2fa/desactivar', authMiddleware(container), desactivar2faController(container));

  // Recuperación de contraseña por correo electrónico (Bloque H - RF-SA-H1, RF-SA-H4, RF-SA-H6)
  api.post('/recuperar-password/solicitar', solicitarRecuperacionController(container));
  api.get('/recuperar-password/validar', validarTokenController(container));
  api.post('/recuperar-password/restablecer', restablecerPasswordController(container));

  // Flujo OTP de 4 dígitos Glassy OTP V4 (Rate Limit: 5 peticiones / 1 min por IP)
  const otpRateLimiter = createIpRateLimiter({
    ventanaMs: 60 * 1000,
    maxPeticiones: 5,
    mensaje: 'Demasiadas solicitudes de recuperación desde esta IP. Intenta de nuevo en un minuto.',
  });

  api.post('/forgot-password', otpRateLimiter, forgotPasswordController(container));
  api.post('/verify-code', otpRateLimiter, verifyCodeController(container));
  api.post('/reset-password', otpRateLimiter, resetPasswordController(container));

  return api;
}

