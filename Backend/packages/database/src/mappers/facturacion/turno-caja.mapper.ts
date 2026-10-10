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
    );
}