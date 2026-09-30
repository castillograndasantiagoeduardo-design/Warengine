/**
 * main.ts — Punto de entrada de la API REST de Warengine.
 */
import { Hono } from 'hono';
import { createContainer } from '@warengine/composition';
import { createAutenticacionRoutes } from './routes/autenticacion.routes.ts';

const app = new Hono();
const container = createContainer();

// Rutas base
app.get('/health', (c) => c.text('Warengine API - OK'));

// Registro de módulos
const authRoutes = createAutenticacionRoutes(container);
app.route('/auth', authRoutes);

console.log('🚀 Warengine API escuchando en http://localhost:8000');
Deno.serve({ port: 8000 }, app.fetch);
