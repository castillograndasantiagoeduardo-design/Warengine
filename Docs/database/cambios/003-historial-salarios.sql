-- ============================================================================
-- CAMBIO: 003-historial-salarios.sql
-- Módulo: Administración - Historial Salarial de Empleados (RF-ADM-C14)
-- ============================================================================
--
-- DESCRIPCIÓN:
-- Crea la tabla `historial_salarios` y el trigger `trg_historial_salarios_sync`
-- que sincroniza automáticamente el campo `empleados.sueldo_actual` tras cada
-- inserción de ajuste salarial.
--
-- REGLA DE ARQUITECTURA:
-- El backend NUNCA ejecuta `UPDATE empleados SET sueldo_actual = ...` directamente.
-- Toda mutación salarial debe insertarse en `historial_salarios`, delegando
-- la actualización del sueldo vigente a nivel de motor MySQL mediante este trigger.
-- ============================================================================

CREATE TABLE IF NOT EXISTS historial_salarios (
    id_historial_salario CHAR(36) NOT NULL DEFAULT (UUID()),
    empleado_id          CHAR(36) NOT NULL,
    sueldo               DECIMAL(14,2) NOT NULL,
    fecha_efectiva       DATE NOT NULL DEFAULT (CURDATE()),
    motivo               VARCHAR(255) NULL,
    registrado_por       CHAR(36) NOT NULL,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           DATETIME NULL,
    PRIMARY KEY (id_historial_salario),
    INDEX idx_historial_salarios_empleado_id (empleado_id),
    CONSTRAINT fk_historial_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
    CONSTRAINT fk_historial_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- TRIGGER: trg_historial_salarios_sync
-- Sincroniza automáticamente empleados.sueldo_actual con el nuevo valor.
-- ----------------------------------------------------------------------------
DELIMITER $$

DROP TRIGGER IF EXISTS trg_historial_salarios_sync$$

CREATE TRIGGER trg_historial_salarios_sync
AFTER INSERT ON historial_salarios
FOR EACH ROW
BEGIN
    UPDATE empleados
    SET sueldo_actual = NEW.sueldo
    WHERE id_empleado = NEW.empleado_id;
END$$

DELIMITER ;
