import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { PERMISSIONS } from '@warengine/contracts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { conversarConAsistenteController } from '../controllers/asistente/asistente.controller.ts';

export function createAsistenteRoutes(container: AppContainer): Hono {
  const api = new Hono();

  // POST /asistente/chat — Consulta conversacional con el Asistente IA (RF-SA-i1)
  // Protegido con authMiddleware requiriendo permiso 'mcp:consultar'
  api.post('/chat', authMiddleware(container, PERMISSIONS.MCP_CONSULTAR), conversarConAsistenteController(container));

  return api;
}
