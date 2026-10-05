import { Sucursal } from '@warengine/core';
import { SucursalRecord } from '../../schema/administracion.schema.ts';

export function sucursalFromRow(row: SucursalRecord): Sucursal {
  return new Sucursal(row.id_sucursal, row.nombre, row.direccion, row.contacto, row.is_active === 1);
}