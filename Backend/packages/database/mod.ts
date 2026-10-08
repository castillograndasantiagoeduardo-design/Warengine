/**
 * mod.ts — Punto de entrada de @warengine/database.
 *
 * Exporta los adaptadores de persistencia:
 *   - schema        → tablas Drizzle (autenticacion, administracion…)
 *
 * REGLA: este paquete implementa ports de @warengine/core, pero core
 * no lo importa a él. La dirección de dependencia es unidireccional.
 */

export * from './src/schema/index.ts';
