-- ==============================================================================
-- CAMBIO 006: Sincronización y estructura de tabla password_reset_tokens
-- Flujo de recuperación Glassy OTP V4 (código de 4 dígitos + resetToken)
-- ==============================================================================

-- La tabla password_reset_tokens en el esquema warengine soporta:
-- 1. id: BIGINT UNSIGNED AUTO_INCREMENT
-- 2. id_usuario: CHAR(36) vinculado a usuarios(id_usuario) ON DELETE CASCADE
-- 3. email: VARCHAR(150)
-- 4. code_hash: CHAR(64) - HMAC-SHA256 del código de 4 dígitos
-- 5. attempts: TINYINT UNSIGNED DEFAULT 0 - Contador de intentos fallidos (máximo 5)
-- 6. expires_at: DATETIME - Expiración del código OTP (10 minutos)
-- 7. reset_token_hash: CHAR(64) - SHA-256 del token de reseteo generado tras verificar el código
-- 8. reset_token_expires_at: DATETIME - Expiración del resetToken (15 minutos)
-- 9. used: TINYINT(1) DEFAULT 0 - Estado de uso único
-- 10. created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` char(36) NOT NULL,
  `email` varchar(150) NOT NULL,
  `code_hash` char(64) DEFAULT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `reset_token_hash` char(64) DEFAULT NULL,
  `reset_token_expires_at` datetime DEFAULT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_token` (`reset_token_hash`),
  KEY `fk_prt_usuario` (`id_usuario`),
  CONSTRAINT `fk_prt_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
