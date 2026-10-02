import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { loginController } from '../controllers/autenticacion/login.controller.ts';
import { renovarTokenController } from '../controllers/autenticacion/renovar-token.controller.ts';
import { logoutController } from '../controllers/autenticacion/logout.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';

export function createAutenticacionRoutes(container: AppContainer): Hono {
  const api = new Hono();

  api.post('/login', loginController(container));
  api.post('/renovar-token', renovarTokenController(container));
  api.post('/logout', logoutController());
  api.get('/verificar', authMiddleware(container), (c) => {
    return c.json({ ok: true, message: 'Sesión activa y autenticada correctamente' });
  });

  return api;
}
