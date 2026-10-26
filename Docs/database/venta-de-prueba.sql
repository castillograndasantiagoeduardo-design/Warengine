-- =============================================================================
-- venta-de-prueba.sql — Inserta UNA venta para alterar las métricas del dashboard.
--
-- Cómo usarlo:
--   1. Ajusta la sección PARÁMETROS (sede, cajero, cliente, fecha) y las LÍNEAS.
--   2. Ejecútalo completo en MySQL Workbench / DBeaver / mysql CLI sobre la BD warengine.
--   3. Repite cambiando las líneas o la fecha para generar más ventas.
--
-- Qué hacen los triggers de la BD automáticamente (no insertes esto a mano):
--   - trg_factura_items_check_stock: rechaza la venta si no hay stock suficiente.
--   - trg_factura_items_genera_salida: crea la salida en movimientos_inventario (kardex)
--     y descuenta inventario_sucursal.stock_actual.
--   - trg_factura_pagos_check_total: rechaza pagos que superen el total.
--
-- Qué métricas cambia:
--   - Ingresos, # facturas, ticket promedio  → facturas.total (estado 'emitida')
--   - Costo, ganancia neta y margen         → factura_items.cantidad × productos.precio_compra
--   - Tendencias (día/semana/mes)           → facturas.fecha
--   - Rendimiento por sede                  → facturas.sucursal_id
--   - Ranking de productos                  → factura_items.cantidad por producto
--   - Alertas de stock                      → si la venta deja un producto en o bajo su mínimo
--
-- IMPORTANTE (fechas): la aplicación guarda las fechas en UTC. Colombia es UTC-5:
-- una venta a las 3:00 p. m. de Bogotá se guarda como 20:00 del mismo día.
-- =============================================================================

-- ─── PARÁMETROS ──────────────────────────────────────────────────────────────
SET @sede     := 'Sede Norte';                    -- 'Sede Norte' | 'Sede Centro' (la principal no tiene stock)
SET @vendedor := 'cajero1@warengine.local';       -- usuario que factura
SET @cliente  := '222222222222';                  -- documento del cliente (222222222222 = Consumidor Final)
SET @medio    := 'efectivo';                      -- 'efectivo' | 'tarjeta' | 'transferencia'
SET @fecha    := UTC_TIMESTAMP();                 -- ahora; o una fecha UTC fija: '2026-10-24 20:30:00'

-- ─── LÍNEAS DE LA VENTA (SKU y cantidad) ─────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS tmp_lineas;
CREATE TEMPORARY TABLE tmp_lineas (sku VARCHAR(50) COLLATE utf8mb4_bin, cantidad INT);
INSERT INTO tmp_lineas (sku, cantidad) VALUES
  ('BEB-002', 3),     -- Gaseosa cola 1.5 L
  ('LAC-001', 2),     -- Leche entera 1 L
  ('SNK-001', 4);     -- Papas fritas 150 g

-- ─── Resolución de ids (no editar) ───────────────────────────────────────────
-- Las variables @ toman la colación de la conexión, que cambia según el cliente (Workbench,
-- DBeaver, mysql CLI); por eso cada comparación fija la colación de la columna.
SET @sucursal_id := (SELECT id_sucursal FROM sucursales WHERE nombre = @sede COLLATE utf8mb4_0900_ai_ci);
SET @usuario_id  := (SELECT id_usuario  FROM usuarios   WHERE email = @vendedor COLLATE utf8mb4_0900_ai_ci);
SET @cliente_id  := (SELECT id_cliente  FROM clientes   WHERE numero_documento = @cliente COLLATE utf8mb4_bin LIMIT 1);
SET @total       := (SELECT SUM(l.cantidad * p.precio_venta)
                       FROM tmp_lineas l JOIN productos p ON p.sku = l.sku);

-- Verificación previa: ninguna de estas columnas debe salir NULL
SELECT @sucursal_id AS sucursal_id, @usuario_id AS usuario_id, @cliente_id AS cliente_id, @total AS total,
       (SELECT COUNT(*) FROM tmp_lineas l LEFT JOIN productos p ON p.sku = l.sku WHERE p.id_producto IS NULL) AS skus_inexistentes;

-- ─── Inserción atómica ───────────────────────────────────────────────────────
START TRANSACTION;

SET @factura_id  := UUID();
SET @consecutivo := (SELECT COALESCE(MAX(consecutivo), 0) + 1 FROM facturas WHERE sucursal_id = @sucursal_id);

-- 1) Cabecera (IVA 0, igual que la regla actual de Factura.calcularTotales)
INSERT INTO facturas
  (id_factura, consecutivo, cliente_id, usuario_id, sucursal_id, turno_caja_id, subtotal, iva, total, estado, fecha)
VALUES
  (@factura_id, @consecutivo, @cliente_id, @usuario_id, @sucursal_id, NULL, @total, 0, @total, 'emitida', @fecha);

-- 2) Líneas al precio de venta vigente (los triggers validan stock y escriben el kardex)
INSERT INTO factura_items (id_factura_item, factura_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
SELECT UUID(), @factura_id, p.id_producto, l.cantidad, p.precio_venta, 0, l.cantidad * p.precio_venta
  FROM tmp_lineas l
  JOIN productos p ON p.sku = l.sku;

-- 3) Pago por el total exacto
INSERT INTO factura_pagos (id_factura_pago, factura_id, medio_pago, monto, referencia_transaccion, fecha)
VALUES (UUID(), @factura_id, @medio, @total, IF(@medio = 'efectivo', NULL, CONCAT('PRUEBA-', @consecutivo)), @fecha);

COMMIT;

-- ─── Comprobación ────────────────────────────────────────────────────────────
SELECT f.consecutivo, s.nombre AS sede, f.total, f.fecha AS fecha_utc
  FROM facturas f JOIN sucursales s ON s.id_sucursal = f.sucursal_id
 WHERE f.id_factura = @factura_id;

SELECT p.sku, p.nombre, i.stock_actual, i.stock_minimo
  FROM tmp_lineas l
  JOIN productos p ON p.sku = l.sku
  JOIN inventario_sucursal i ON i.producto_id = p.id_producto AND i.sucursal_id = @sucursal_id;

DROP TEMPORARY TABLE IF EXISTS tmp_lineas;
