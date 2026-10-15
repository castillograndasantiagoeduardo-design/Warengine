import { TurnoCaja } from '@warengine/core';
import { TurnoCajaRecord } from '../../schema/turnos-caja.schema.ts';

export function turnoCajaFromRow(row: TurnoCajaRecord): TurnoCaja {
    return new TurnoCaja(
        row.id_turno_caja,
        row.usuario_id,
        row.sucursal_id,
        Number(row.fondo_inicial), // Drizzle devuelve DECIMAL como string
        row.fecha_apertura,
        row.fecha_cierre,
        row.fondo_final !== null && row.fondo_final !== undefined ? Number(row.fondo_final) : null,
        row.diferencia !== null && row.diferencia !== undefined ? Number(row.diferencia) : null,
    );
}