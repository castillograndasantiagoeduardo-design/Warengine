import { Proveedor } from '@warengine/core';
import { ProveedorRecord } from '../../schema/inventario.schema.ts';

export function proveedorFromRow(row: ProveedorRecord): Proveedor {
  return new Proveedor(row.id_proveedor, row.nombre, row.contacto, row.is_active === 1);
}
