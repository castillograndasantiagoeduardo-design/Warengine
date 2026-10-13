-- ============================================================================
-- CAMBIO: 004-alertas-admin.sql
-- Módulo: Administración - Gestión de Alertas Administrativas (RF-ADM-C13)
-- ============================================================================
--
-- DESCRIPCIÓN:
-- Crea la tabla `alertas_admin` para el registro, consulta y atención de
-- incidentes operativos y alertas administrativas con alcance por sucursal.
-- ============================================================================

CREATE TABLE IF NOT EXISTS alertas_admin (
    id_alerta_admin CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id      CHAR(36) NOT NULL,
    sucursal_id     INT NOT NULL,
    motivo          VARCHAR(100) NOT NULL,
    prioridad       VARCHAR(10) NOT NULL DEFAULT 'normal',
    descripcion     VARCHAR(500) NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_atencion  DATETIME NULL,
    PRIMARY KEY (id_alerta_admin),
    INDEX idx_alertas_usuario_id (usuario_id),
    INDEX idx_alertas_sucursal_id (sucursal_id),
    INDEX idx_alertas_estado (estado),
    CONSTRAINT fk_alertas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT chk_alertas_prioridad CHECK (prioridad IN ('urgente', 'normal')),
    CONSTRAINT chk_alertas_estado CHECK (estado IN ('pendiente', 'visto', 'atendido'))
) ENGINE=InnoDB;
