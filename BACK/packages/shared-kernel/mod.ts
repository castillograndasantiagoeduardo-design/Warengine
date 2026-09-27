/**
 * mod.ts — Punto de entrada de @warengine/shared-kernel.
 *
 * Exportará las piezas base sin dependencias externas:
 *   - Result<T, E>      → tipo para operaciones que pueden fallar sin lanzar excepciones
 *   - DomainError       → clase base para todos los errores de dominio de Warengine
 *   - Entity<T>         → clase base para entidades con identidad
 *   - ValueObject<T>    → clase base para objetos de valor inmutables
 *   - Money             → value object para manejo seguro de cantidades monetarias
 *   - Clock             → abstracción del tiempo (permite inyectar tiempo en tests)
 *   - Pagination        → tipos para consultas paginadas
 *   - ids               → utilidades para generar UUIDs
 *
 * REGLA: este paquete no debe importar NADA externo. Ni zod, ni Drizzle,
 * ni nada de Deno stdlib. Solo TypeScript puro.
 */

// TODO: exportar implementaciones cuando se desarrolle el módulo.
