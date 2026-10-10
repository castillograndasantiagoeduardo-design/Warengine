/**
 * main.ts — Punto de entrada de la API REST de Warengine.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createContainer } from '@warengine/composition';
import { createAutenticacionRoutes } from './routes/autenticacion.routes.ts';
import { createAdministracionRoutes } from './routes/administracion.routes.ts';
import { createFacturacionRoutes } from './routes/facturacion.routes.ts';
import { createInventarioRoutes } from './routes/inventario.routes.ts';

const app = new Hono();
const container = createContainer();

// Orígenes permitidos para CORS leídos de CORS_ORIGENES (separados por coma)
const corsOrigenesRaw = Deno.env.get('CORS_ORIGENES') || 'http://localhost:3000';
const origenesPermitidos = corsOrigenesRaw
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

// CORS habilitado con credentials solo para los orígenes en la lista permitida (RF-SA-D3)
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (origin && origenesPermitidos.includes(origin)) {
        return origin;
      }
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Rutas base
app.get('/health', (c) => c.text('Warengine API - OK'));

// Registro de módulos
const authRoutes = createAutenticacionRoutes(container);
app.route('/auth', authRoutes);

const adminRoutes = createAdministracionRoutes(container);
app.route('/administracion', adminRoutes);

const facturacionRoutes = createFacturacionRoutes(container);
app.route('/ventas', facturacionRoutes);
const inventarioRoutes = createInventarioRoutes(container);
app.route('/inventario', inventarioRoutes);

console.log('🚀 Warengine API escuchando en http://localhost:8017');
Deno.serve({ port: 8017 }, app.fetch);
