-- ==============================================================================
-- CAMBIO 007: Cierre administrativo de turnos de caja
-- Permite al admin de sucursal cerrar turnos de cajeros con motivo y auditoría
-- ==============================================================================

-- 1. Nuevas columnas en turnos_caja:
-- tipo_cierre: 'normal' por defecto para compatibilidad con datos existentes
-- cerrado_por: ID del usuario admin que autorizó el cierre administrativo (NULL si fue normal)
-- motivo_cierre: Justificación obligatoria en cierres administrativos

ALTER TABLE `turnos_caja`
  ADD COLUMN `tipo_cierre` VARCHAR(20) NOT NULL DEFAULT 'normal' AFTER `diferencia`,
  ADD COLUMN `cerrado_por` CHAR(36) NULL AFTER `tipo_cierre`,
  ADD COLUMN `motivo_cierre` TEXT NULL AFTER `cerrado_por`;

ALTER TABLE `turnos_caja`
  ADD CONSTRAINT `fk_turnos_cerrado_por`
  FOREIGN KEY (`cerrado_por`) REFERENCES `usuarios` (`id_usuario`)
  ON DELETE RESTRICT;

-- 2. Modificación del trigger trg_turnos_caja_calcula_diferencia:
-- Para tipo_cierre = 'normal', exige fondo_final y calcula diferencia.
-- Para tipo_cierre = 'administrativo':
--   Si fondo_final es NULL, permite el cierre sin arqueo (diferencia = NULL).
--   Si fondo_final tiene valor, calcula la diferencia normalmente.

DROP TRIGGER IF EXISTS trg_turnos_caja_calcula_diferencia;

DELIMITER $$

CREATE TRIGGER trg_turnos_caja_calcula_diferencia
BEFORE UPDATE ON turnos_caja
FOR EACH ROW
BEGIN
    DECLARE v_efectivo_vendido DECIMAL(14,2) DEFAULT 0;

    IF NEW.fecha_cierre IS NOT NULL AND OLD.fecha_cierre IS NULL THEN
        -- Si es normal y no hay fondo final, error
        IF (NEW.tipo_cierre IS NULL OR NEW.tipo_cierre = 'normal') AND NEW.fondo_final IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No se puede cerrar el turno sin registrar el fondo_final contado en caja';
        END IF;

        -- Si hay fondo final, calculamos la diferencia automáticamente
        IF NEW.fondo_final IS NOT NULL THEN
            SELECT COALESCE(SUM(fp.monto), 0) INTO v_efectivo_vendido
                FROM factura_pagos fp
                JOIN facturas f ON f.id_factura = fp.factura_id
                WHERE f.turno_caja_id = NEW.id_turno_caja
                  AND fp.medio_pago = 'efectivo'
                  AND f.estado = 'emitida';

            SET NEW.diferencia = NEW.fondo_final - (NEW.fondo_inicial + v_efectivo_vendido);
        ELSE
            -- Cierre administrativo sin conteo de efectivo
            SET NEW.diferencia = NULL;
        END IF;
    END IF;
END$$

DELIMITER ;
