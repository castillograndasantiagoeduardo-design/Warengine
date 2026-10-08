import type { Config } from 'drizzle-kit';

/**
 * drizzle.config.ts — Configuración de Drizzle Kit para generación de migraciones.
 *
 * IMPORTANTE: este archivo lo ejecuta drizzle-kit, que corre en Node.js,
 * no en Deno. Por eso:
 *  - El import es el paquete npm estándar (sin prefijo "npm:").
 *  - Las variables de entorno se leen con process.env, no con Deno.env.get().
 *
 * Las variables DB_* deben estar definidas en .env antes de ejecutar
 * cualquier comando de migración (drizzle-kit carga .env automáticamente).
 */
export default {
  schema: './src/schema',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? 3306),
    user: process.env['DB_USER'] ?? '',
    password: process.env['DB_PASSWORD'] ?? '',
    database: process.env['DB_NAME'] ?? 'warengine',
  },
} satisfies Config;
