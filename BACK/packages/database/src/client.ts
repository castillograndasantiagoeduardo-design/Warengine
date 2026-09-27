/**
 * client.ts — Conexión a MySQL mediante Drizzle ORM.
 *
 * Crea y exporta una instancia del cliente Drizzle lista para usar en
 * los repositorios. La configuración se lee de las variables de entorno
 * ya validadas por packages/platform/src/config.
 *
 * PROHIBIDO: usar este cliente directamente en apps/api o apps/mcp-server.
 * Solo los repositorios en packages/database/src/repositories lo usan.
 */

// TODO: implementar cuando se instale drizzle-orm y mysql2 para Deno.
