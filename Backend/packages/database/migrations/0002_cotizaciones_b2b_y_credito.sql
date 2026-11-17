-- Migración 0002: Cotizaciones B2B con aval de Admin de Sucursal + Evaluación de Crédito B2B
-- Espejo de `Docs/database/cambios/008-cotizaciones-b2b-y-credito.sql`.

ALTER TABLE `clientes`
  ADD COLUMN `ganancia_neta_mensual` DECIMAL(14,2) NULL AFTER `credito_habilitado`,
  ADD COLUMN `antiguedad_empresa_meses` INT UNSIGNED NULL AFTER `ganancia_neta_mensual`,
  ADD COLUMN `plazo_credito_dias` SMALLINT UNSIGNED NULL DEFAULT 30 AFTER `antiguedad_empresa_meses`,
  ADD COLUMN `cupo_credito_sugerido` DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER `plazo_credito_dias`,
  ADD COLUMN `cupo_credito_aprobado` DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER `cupo_credito_sugerido`,
  ADD COLUMN `cupo_credito_utilizado` DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER `cupo_credito_aprobado`,
  ADD COLUMN `nivel_riesgo_credito` VARCHAR(10) NULL AFTER `cupo_credito_utilizado`,
  ADD COLUMN `estado_credito` VARCHAR(25) NOT NULL DEFAULT 'sin_solicitud' AFTER `nivel_riesgo_credito`,
  ADD COLUMN `credito_aprobado_por` CHAR(36) NULL AFTER `estado_credito`,
  ADD COLUMN `credito_aprobado_en` DATETIME NULL AFTER `credito_aprobado_por`,
  ADD COLUMN `motivo_decision_credito` VARCHAR(255) NULL AFTER `credito_aprobado_en`,
  ADD COLUMN `observacion_financiera` VARCHAR(500) NULL AFTER `motivo_decision_credito`,
  ADD INDEX `idx_clientes_estado_credito` (`estado_credito`),
  ADD CONSTRAINT `fk_clientes_credito_aprobado_por` FOREIGN KEY (`credito_aprobado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `chk_clientes_nivel_riesgo` CHECK (`nivel_riesgo_credito` IS NULL OR `nivel_riesgo_credito` IN ('bajo','medio','alto')),
  ADD CONSTRAINT `chk_clientes_estado_credito` CHECK (`estado_credito` IN ('sin_solicitud','pendiente_aprobacion','aprobado','rechazado')),
  ADD CONSTRAINT `chk_clientes_cupos_no_negativos` CHECK (`cupo_credito_sugerido` >= 0 AND `cupo_credito_aprobado` >= 0 AND `cupo_credito_utilizado` >= 0);

ALTER TABLE `alertas_admin`
  ADD COLUMN `destinatario_rol` VARCHAR(30) NULL AFTER `estado`,
  ADD INDEX `idx_alertas_destinatario_rol` (`destinatario_rol`),
  ADD CONSTRAINT `chk_alertas_destinatario_rol` CHECK (`destinatario_rol` IS NULL OR `destinatario_rol` IN ('super-admin','admin-sucursal'));

CREATE TABLE IF NOT EXISTS `cotizaciones_b2b` (
  `id_cotizacion` char(36) NOT NULL DEFAULT (uuid()),
  `consecutivo` int NOT NULL,
  `cliente_id` char(36) NOT NULL,
  `vendedor_id` char(36) NOT NULL,
  `sucursal_id` int NOT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `iva` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL,
  `medio_pago_sugerido` varchar(30) NOT NULL DEFAULT 'transferencia',
  `referencia_pago` varchar(100) DEFAULT NULL,
  `estado` varchar(25) NOT NULL DEFAULT 'pendiente_aval',
  `estado_pedido` varchar(25) DEFAULT NULL,
  `valida_hasta` datetime NOT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `aprobado_por` char(36) DEFAULT NULL,
  `fecha_aval` datetime DEFAULT NULL,
  `motivo_rechazo` varchar(255) DEFAULT NULL,
  `factura_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cotizacion`),
  UNIQUE KEY `uq_cotizaciones_b2b_consecutivo_sucursal` (`sucursal_id`, `consecutivo`),
  KEY `idx_cotizaciones_b2b_cliente` (`cliente_id`),
  KEY `idx_cotizaciones_b2b_vendedor` (`vendedor_id`),
  KEY `idx_cotizaciones_b2b_sucursal` (`sucursal_id`),
  KEY `idx_cotizaciones_b2b_estado` (`estado`),
  KEY `idx_cotizaciones_b2b_factura` (`factura_id`),
  CONSTRAINT `fk_cotizaciones_b2b_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cotizaciones_b2b_vendedor` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cotizaciones_b2b_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id_sucursal`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cotizaciones_b2b_aprobado_por` FOREIGN KEY (`aprobado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `fk_cotizaciones_b2b_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id_factura`) ON DELETE SET NULL,
  CONSTRAINT `chk_cotizaciones_b2b_medio` CHECK (`medio_pago_sugerido` IN ('efectivo','tarjeta','transferencia','credito_corporativo')),
  CONSTRAINT `chk_cotizaciones_b2b_estado` CHECK (`estado` IN ('borrador','pendiente_aval','aprobada','rechazada','facturada','vencida')),
  CONSTRAINT `chk_cotizaciones_b2b_estado_pedido` CHECK (`estado_pedido` IS NULL OR `estado_pedido` IN ('en_proceso','despachado','entregado','cancelado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `cotizacion_b2b_items` (
  `id_cotizacion_item` char(36) NOT NULL DEFAULT (uuid()),
  `cotizacion_id` char(36) NOT NULL,
  `producto_id` char(36) NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(14,2) NOT NULL,
  `descuento` decimal(14,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id_cotizacion_item`),
  KEY `idx_cotizacion_items_cotizacion` (`cotizacion_id`),
  KEY `idx_cotizacion_items_producto` (`producto_id`),
  CONSTRAINT `fk_cotizacion_items_cotizacion` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones_b2b` (`id_cotizacion`) ON DELETE CASCADE,
  CONSTRAINT `fk_cotizacion_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id_producto`) ON DELETE RESTRICT,
  CONSTRAINT `chk_cotizacion_items_cantidad` CHECK (`cantidad` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
