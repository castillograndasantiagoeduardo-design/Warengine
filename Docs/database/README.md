# Base de Datos Warengine — Guía de Migraciones y Operación

Este directorio contiene los esquemas maestros, semillas y scripts incrementales de migración de base de datos de WarEngine (MySQL 8.0).

---

## 1. Estructura de Directorios

- `WARENGINE_FULL_BD.sql`: Script DDL consolidado de la base de datos completa.
- `cambios/`: Scripts de migración secuenciales aplicados a lo largo de las distintas fases:
  - `001-logs-auditoria-solo-insercion.sql`
  - `002-turnos-un-abierto-por-usuario.sql`
  - `003-historial-salarios.sql`
  - `004-alertas-admin.sql`
  - `005-categorias-activos.sql`
  - `005-logs-mcp-tools.sql`
  - `006-password-reset-otp.sql`
  - `007-cierre-administrativo-turnos.sql`

---

## 2. Documentación Técnica: Migración 007 (`007-cierre-administrativo-turnos.sql`)

### 2.1 Propósito
La migración 007 agrega las columnas `tipo_cierre`, `cerrado_por` y `motivo_cierre` a la tabla `turnos_caja`, y actualiza el trigger `trg_turnos_caja_calcula_diferencia` para permitir cierres administrativos de contingencia donde el arqueo físico en efectivo es opcional.

### 2.2 Requisitos y Privilegios en MySQL
En instancias de MySQL con registro binario activo (`log_bin = ON`), la creación o reemplazo de funciones y triggers almacenados exige por defecto la variable global:
```sql
SET GLOBAL log_bin_trust_function_creators = 1;
```
- **Privilegio Requerido:** Se requiere el privilegio `SUPER` o `SYSTEM_VARIABLES_ADMIN`.
- **Causa del Requisito:** MySQL impone esta restricción para salvaguardar la replicación binaria cuando una rutina no está explícitamente marcada como `DETERMINISTIC`, `NO SQL` o `READS SQL DATA`.

### 2.3 Aplicación en Entornos Restringidos o Managed DB (AWS RDS, GCP Cloud SQL, PlanetScale)
En servidores gestionados en la nube donde los usuarios no tienen el privilegio `SUPER`:
1. **AWS RDS / Aurora:** Modificar el parámetro `log_bin_trust_function_creators = 1` en el **DB Parameter Group** asociado a la instancia de base de datos.
2. **GCP Cloud SQL:** Configurar el flag de base de datos `log_bin_trust_function_creators = on` en la consola de Google Cloud.
3. **Hostings sin acceso a parámetros globales:**
   Si la plataforma prohíbe de forma absoluta la creación de triggers:
   - Aplicar únicamente la parte DDL de la migración (columnas y foreign keys):
     ```sql
     ALTER TABLE `turnos_caja`
       ADD COLUMN `tipo_cierre` VARCHAR(20) NOT NULL DEFAULT 'normal' AFTER `diferencia`,
       ADD COLUMN `cerrado_por` CHAR(36) NULL AFTER `tipo_cierre`,
       ADD COLUMN `motivo_cierre` TEXT NULL AFTER `cerrado_por`;

     ALTER TABLE `turnos_caja`
       ADD CONSTRAINT `fk_turnos_cerrado_por`
       FOREIGN KEY (`cerrado_por`) REFERENCES `usuarios` (`id_usuario`)
       ON DELETE RESTRICT;
     ```
   - Omitir el trigger `trg_turnos_caja_calcula_diferencia`. La validación de fondo final y el cálculo de la diferencia ya se encuentran garantizados en la capa de aplicación y dominio (`CerrarTurnoCajaUseCase` y `CerrarTurnoAdministrativoUseCase`).

### 2.4 Script de Reversión (Rollback / Downgrade)
Para revertir completamente la migración 007 a su estado previo:

```sql
-- 1. Restaurar el trigger a la versión anterior que exigía fondo_final incondicionalmente
DROP TRIGGER IF EXISTS trg_turnos_caja_calcula_diferencia;

DELIMITER $$
CREATE TRIGGER trg_turnos_caja_calcula_diferencia
BEFORE UPDATE ON turnos_caja
FOR EACH ROW
BEGIN
    DECLARE v_efectivo_vendido DECIMAL(14,2) DEFAULT 0;

    IF NEW.fecha_cierre IS NOT NULL AND OLD.fecha_cierre IS NULL THEN
        IF NEW.fondo_final IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No se puede cerrar el turno sin registrar el fondo_final contado en caja';
        END IF;

        SELECT COALESCE(SUM(fp.monto), 0) INTO v_efectivo_vendido
            FROM factura_pagos fp
            JOIN facturas f ON f.id_factura = fp.factura_id
            WHERE f.turno_caja_id = NEW.id_turno_caja
              AND fp.medio_pago = 'efectivo'
              AND f.estado = 'emitida';

        SET NEW.diferencia = NEW.fondo_final - (NEW.fondo_inicial + v_efectivo_vendido);
    END IF;
END$$
DELIMITER ;

-- 2. Eliminar clave foránea y columnas añadidas
ALTER TABLE `turnos_caja` DROP FOREIGN KEY `fk_turnos_cerrado_por`;
ALTER TABLE `turnos_caja`
  DROP COLUMN `motivo_cierre`,
  DROP COLUMN `cerrado_por`,
  DROP COLUMN `tipo_cierre`;
```
