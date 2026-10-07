import { Cliente, TipoCliente, TipoDocumentoCliente } from '@warengine/core';
import { ClienteRecord } from '../../schema/facturacion.schema.ts';

export function clienteFromRow(row: ClienteRecord): Cliente {
    return new Cliente(
        row.id_cliente,
        row.tipo_documento as TipoDocumentoCliente,
        row.numero_documento,
        row.nombre_razon_social,
        row.tipo_cliente as TipoCliente,
        row.email,
        row.telefono,
        row.direccion,
        row.credito_habilitado === 1,
    );
}