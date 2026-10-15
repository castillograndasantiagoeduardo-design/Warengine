import { and, eq, isNull } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { turnos_caja } from '../../schema/turnos-caja.schema.ts';
import { DatosAperturaTurno, ITurnoCajaRepository, TurnoCaja } from '@warengine/core';
import { turnoCajaFromRow } from '../../mappers/facturacion/turno-caja.mapper.ts';

const MYSQL_CLAVE_DUPLICADA = 1062;

/** Según la versión de Drizzle, el error de mysql2 puede venir en error.cause. */
function esClaveDuplicada(error: unknown): boolean {
    const e = error as { errno?: number; cause?: { errno?: number } };
    return e?.errno === MYSQL_CLAVE_DUPLICADA || e?.cause?.errno === MYSQL_CLAVE_DUPLICADA;
}

export class DrizzleTurnoCajaRepository implements ITurnoCajaRepository {
    constructor(private readonly db: Database) { }

    public async buscarAbiertoDeUsuario(usuarioId: string): Promise<TurnoCaja | null> {
        const [row] = await this.db
            .select()
            .from(turnos_caja)
            .where(
                and(
                    eq(turnos_caja.usuario_id, usuarioId),
                    isNull(turnos_caja.fecha_cierre),
                    isNull(turnos_caja.deleted_at),
                ),
            )
            .limit(1);
        return row ? turnoCajaFromRow(row) : null;
    }

    public async abrir(datos: DatosAperturaTurno): Promise<TurnoCaja | null> {
        const id = crypto.randomUUID();
        try {
            await this.db.insert(turnos_caja).values({
                id_turno_caja: id,
                usuario_id: datos.usuarioId,
                sucursal_id: datos.sucursalId,
                fondo_inicial: datos.fondoInicial.toFixed(2),
            });
        } catch (error) {
            // uq_turnos_un_abierto_por_usuario: otra petición ganó la carrera.
            if (esClaveDuplicada(error)) return null;
            throw error;
        }
        const [row] = await this.db
            .select()
            .from(turnos_caja)
            .where(eq(turnos_caja.id_turno_caja, id))
            .limit(1);
        return turnoCajaFromRow(row);
    }

    public async findById(id: string): Promise<TurnoCaja | null> {
        const [row] = await this.db
            .select()
            .from(turnos_caja)
            .where(
                and(
                    eq(turnos_caja.id_turno_caja, id),
                    isNull(turnos_caja.deleted_at),
                ),
            )
            .limit(1);
        return row ? turnoCajaFromRow(row) : null;
    }

    public async cerrar(id: string, fondoFinal: number): Promise<TurnoCaja> {
        await this.db
            .update(turnos_caja)
            .set({
                fondo_final: fondoFinal.toFixed(2),
                fecha_cierre: new Date(),
            })
            .where(eq(turnos_caja.id_turno_caja, id));

        const turno = await this.findById(id);
        if (!turno) {
            throw new Error(`Turno no encontrado tras cierre: ${id}`);
        }
        return turno;
    }
}