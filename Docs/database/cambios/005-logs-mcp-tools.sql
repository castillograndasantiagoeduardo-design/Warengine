-- ============================================================================
-- CAMBIO: 005-logs-mcp-tools.sql
-- Módulo: Servidor MCP y Asistente IA — Auditoría Forense de Tools (RF-SA-I9)
-- ============================================================================
--
-- DESCRIPCIÓN:
-- Crea la tabla `logs_mcp_tools` para registrar de manera auditable y persistente
-- toda ejecución de herramientas (Tools) por parte del asistente conversacional
-- o modelos de lenguaje conectados mediante el protocolo MCP.
-- ============================================================================

DROP TABLE IF EXISTS logs_mcp_tools;

CREATE TABLE logs_mcp_tools (
    id_log_mcp_tool BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tool_name       VARCHAR(100) NOT NULL,
    usuario_id      CHAR(36) NULL,
    sucursal_id     INT NULL,
    parametros      JSON NULL,
    exitoso         TINYINT(1) NOT NULL DEFAULT 1,
    duracion_ms     INT NOT NULL DEFAULT 0,
    error           TEXT NULL,
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_logs_mcp_tool_name (tool_name),
    INDEX idx_logs_mcp_usuario_id (usuario_id),
    INDEX idx_logs_mcp_fecha (fecha),
    CONSTRAINT fk_logs_mcp_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_logs_mcp_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id_sucursal) ON DELETE SET NULL
) ENGINE=InnoDB;

