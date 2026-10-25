/**
 * env.ts — Centralización y tipado de variables de entorno para el Frontend.
 *
 * Sigue el principio Single Responsibility (SRP): una única fuente de verdad
 * para la configuración del entorno en el cliente y servidor de Next.js.
 */

export const env = {
  /**
   * URL base de la API REST de Warengine (Hono).
   * Por defecto: http://localhost:8017 (puerto estándar de backend).
   */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8017',

  /**
   * Indica si la aplicación se ejecuta en modo producción.
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Indica si la aplicación se ejecuta en modo desarrollo.
   */
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;
