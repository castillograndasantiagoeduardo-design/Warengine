-- ============================================================================
-- CAMBIO: 001-logs-auditoria-solo-insercion.sql
-- Inmutabilidad de la tabla logs_auditoria (RNF-ADM-02).
-- Protege contra modificaciones o eliminaciones de registros históricos.
--
-- RECOMENDACIÓN DE SEGURIDAD EN PRODUCCIÓN:
-- El usuario MySQL utilizado por la API debe tener únicamente permisos de
-- INSERT y SELECT sobre la tabla logs_auditoria:
--   GRANT SELECT, INSERT ON warengine.logs_auditoria TO 'warengine_api'@'%';
--   REVOKE UPDATE, DELETE, DROP, ALTER ON warengine.logs_auditoria FROM 'warengine_api'@'%';
-- ============================================================================

DELIMITER $$

CREATE TRIGGER trg_logs_auditoria_bloquea_update
BEFORE UPDATE ON logs_auditoria
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'logs_auditoria es de solo insercion: no se puede modificar un registro de auditoria.';
END$$

CREATE TRIGGER trg_logs_auditoria_bloquea_delete
BEFORE DELETE ON logs_auditoria
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'logs_auditoria es de solo insercion: no se puede eliminar un registro de auditoria.';
END$$

DELIMITER ;
