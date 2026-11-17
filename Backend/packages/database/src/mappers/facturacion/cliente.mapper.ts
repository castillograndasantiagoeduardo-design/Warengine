import type { EstadoCreditoCliente, NivelRiesgoCredito } from '@warengine/contracts';
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
        row.ganancia_neta_mensual !== null && row.ganancia_neta_mensual !== undefined
            ? Number(row.ganancia_neta_mensual)
            : null,
        row.antiguedad_empresa_meses ?? null,
        row.plazo_credito_dias ?? 30,
        Number(row.cupo_credito_sugerido ?? 0),
        Number(row.cupo_credito_aprobado ?? 0),
        Number(row.cupo_credito_utilizado ?? 0),
        (row.nivel_riesgo_credito as NivelRiesgoCredito | null) ?? null,
        (row.estado_credito as EstadoCreditoCliente) ?? 'sin_solicitud',
        row.credito_aprobado_por ?? null,
        row.credito_aprobado_en ?? null,
        row.motivo_decision_credito ?? null,
        row.observacion_financiera ?? null,
    );
}