import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { turnos_caja } from '../../schema/turnos-caja.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { empleados } from '../../schema/administracion.schema.ts';
import { facturas } from '../../schema/facturacion.schema.ts';
import {
    DatosAperturaTurno,
    IConsultaTurnosAbiertosRepository,
    ITurnoCajaRepository,
    TurnoAbiertoResumen,
    TurnoCaja,
} from '@warengine/core';
import { turnoCajaFromRow } from '../../mappers/facturacion/turno-caja.mapper.ts';

const MYSQL_CLAVE_DUPLICADA = 1062;

/** Según la versión de Drizzle, el error de mysql2 puede venir en error.cause. */
function esClaveDuplicada(error: unknown): boolean {
    const e = error as { errno?: number; cause?: { errno?: number } };
    return e?.errno === MYSQL_CLAVE_DUPLICADA || e?.cause?.errno === MYSQL_CLAVE_DUPLICADA;
}

export class DrizzleTurnoCajaRepository implements ITurnoCajaRepository, IConsultaTurnosAbiertosRepository {
    constructor(private readonly db: Database) { }

    public async listarAbiertos(sucursalIds?: number[]): Promise<TurnoAbiertoResumen[]> {
        const condiciones = [isNull(turnos_caja.fecha_cierre), isNull(turnos_caja.deleted_at)];
        if (sucursalIds) condiciones.push(inArray(turnos_caja.sucursal_id, sucursalIds));

        const filas = await this.db
            .select({
                id: turnos_caja.id_turno_caja,
                usuarioId: turnos_caja.usuario_id,
                cajeroNombre: empleados.nombre,
                cajeroEmail: usuarios.email,
                sucursalId: turnos_caja.sucursal_id,
                fondoInicial: turnos_caja.fondo_inicial,
                fechaApertura: turnos_caja.fecha_apertura,
                cantidadVentas: sql<number>`COUNT(${facturas.id_factura})`,
                totalVentas: sql<string>`COALESCE(SUM(${facturas.total}), 0)`,
            })
            .from(turnos_caja)
            .innerJoin(usuarios, eq(turnos_caja.usuario_id, usuarios.id_usuario))
            .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
            .leftJoin(
                facturas,
                and(eq(facturas.turno_caja_id, turnos_caja.id_turno_caja), eq(facturas.estado, 'emitida')),
            )
            .where(and(...condiciones))
            .groupBy(
                turnos_caja.id_turno_caja,
                turnos_caja.usuario_id,
                empleados.nombre,
                usuarios.email,
                turnos_caja.sucursal_id,
                turnos_caja.fondo_inicial,
                turnos_caja.fecha_apertura,
            )
            .orderBy(asc(turnos_caja.fecha_apertura));

        return filas.map((f) => ({
            id: f.id,
            usuarioId: f.usuarioId,
            cajeroNombre: f.cajeroNombre ?? null,
            cajeroEmail: f.cajeroEmail,
            sucursalId: f.sucursalId,
            fondoInicial: Number(f.fondoInicial),
            fechaApertura: f.fechaApertura,
            cantidadVentas: Number(f.cantidadVentas),
            totalVentas: Number(f.totalVentas),
        }));
    }

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