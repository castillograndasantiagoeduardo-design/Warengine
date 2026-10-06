/**
 * main.ts — Punto de entrada de la API REST de Warengine.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createContainer } from '@warengine/composition';
import { createAutenticacionRoutes } from './routes/autenticacion.routes.ts';
import { createAdministracionRoutes } from './routes/administracion.routes.ts';
import { createInventarioRoutes } from './routes/inventario.routes.ts';

const app = new Hono();
const container = createContainer();

// CORS habilitado con credentials para cookies HttpOnly desde el Frontend
app.use(
  '*',
  cors({
    origin: (origin) => origin || 'http://localhost:3000',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rutas base
app.get('/health', (c) => c.text('Warengine API - OK'));

// Registro de módulos
const authRoutes = createAutenticacionRoutes(container);
app.route('/auth', authRoutes);

const adminRoutes = createAdministracionRoutes(container);
app.route('/administracion', adminRoutes);

const inventarioRoutes = createInventarioRoutes(container);
app.route('/inventario', inventarioRoutes);

console.log('🚀 Warengine API escuchando en http://localhost:8017');
Deno.serve({ port: 8017 }, app.fetch);
