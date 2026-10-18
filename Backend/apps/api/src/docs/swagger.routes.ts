/**
 * swagger.routes.ts — Rutas para servir la documentación interactiva Swagger UI y la especificación OpenAPI 3.0.
 */
import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { openApiSpec } from './openapi.doc.ts';

export function createSwaggerRoutes(): Hono {
  const routes = new Hono();

  // Endpoint de especificación OpenAPI en JSON
  routes.get('/openapi.json', (c) => c.json(openApiSpec));
  routes.get('/swagger.json', (c) => c.json(openApiSpec));

  // Interfaz visual Swagger UI
  routes.get(
    '/swagger',
    swaggerUI({
      url: '/openapi.json',
      title: 'Warengine API — Documentación Swagger',
    }),
  );

  // Redirección amigable /docs -> /swagger
  routes.get('/docs', (c) => c.redirect('/swagger'));

  return routes;
}
