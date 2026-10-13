/**
 * area.mapper.ts
 *
 * Mapeador que transforma registros SQL de la tabla `areas` a instancias de la entidad `Area`.
 *
 * Rol en la arquitectura:
 * - Capa de Persistencia / Mappers.
 * - Desacopla la estructura física relacional de la base de datos del modelo de dominio.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Gestión de áreas por sucursal.
 */

import { Area } from '@warengine/core';
import { AreaRecord } from '../../schema/administracion.schema.ts';

export function areaFromRow(row: AreaRecord): Area {
  return new Area(row.id_area, row.nombre, row.sucursal_id);
}
