/**
 * unit-of-work.ts — Transacciones atómicas multi-tabla.
 *
 * Garantiza que operaciones que afectan múltiples tablas (por ejemplo,
 * emitir una factura + descontar stock + registrar movimiento) se ejecuten
 * dentro de una sola transacción de base de datos.
 *
 * Si cualquier paso falla, se hace rollback completo.
 * Implementa el port UnitOfWork definido en @warengine/core.
 */

// TODO: implementar cuando se desarrolle el módulo de facturación.
