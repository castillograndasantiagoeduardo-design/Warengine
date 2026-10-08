/**
 * mod.ts — Punto de entrada de @warengine/shared-kernel.
 *
 * Exporta las piezas base sin dependencias externas:
 *   - Result<T, E>      → tipo para operaciones que pueden fallar sin lanzar excepciones
 *   - DomainError       → clase base para todos los errores de dominio de Warengine
 *
 * REGLA: este paquete no debe importar NADA externo. Ni zod, ni Drizzle,
 * ni nada de Deno stdlib. Solo TypeScript puro.
 */

export { DomainError } from './src/DomainError.ts';
export { Result } from './src/Result.ts';
export type { ResultadoPaginado } from './src/Pagination.ts';
