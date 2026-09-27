/**
 * mod.ts — Punto de entrada de @warengine/database.
 *
 * Exportará los adaptadores de persistencia:
 *   - client        → conexión a MySQL con Drizzle ORM
 *   - unit-of-work  → transacciones atómicas (facturación + stock)
 *   - schema        → tablas Drizzle (autenticacion, inventario, facturacion…)
 *   - repositories  → implementaciones de los ports de core, por módulo
 *   - mappers       → conversión fila de BD ↔ entidad de dominio
 *
 * REGLA: este paquete implementa ports de @warengine/core, pero core
 * no lo importa a él. La dirección de dependencia es unidireccional.
 */

// TODO: exportar implementaciones cuando se desarrolle el módulo.
