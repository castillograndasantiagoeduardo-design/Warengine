import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { loginController } from '../controllers/autenticacion/login.controller.ts';
import { renovarTokenController } from '../controllers/autenticacion/renovar-token.controller.ts';

export function createAutenticacionRoutes(container: AppContainer): Hono {
  const api = new Hono();

  api.post('/login', loginController(container));
  api.post('/renovar-token', renovarTokenController(container));

  return api;
}
