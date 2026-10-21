-- ============================================================================
-- CAMBIO: 005-categorias-activos.sql
-- Módulo: Logística y Activos Fijos - Categorías de Activos (RF-LOG-A1)
-- ============================================================================
--
-- DESCRIPCIÓN:
-- Agrega la columna `is_active` a la tabla existente `categorias_activos`
-- para permitir la activación e inactivación lógica de familias de activos
-- internos sin eliminar registros.
-- ============================================================================

ALTER TABLE categorias_activos
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
