import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { Database } from '../../client.ts';
import { turnos_caja } from '../../schema/turnos-caja.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { empleados, sucursales } from '../../schema/administracion.schema.ts';
import { facturas, factura_pagos } from '../../schema/facturacion.schema.ts';
import {
    DatosAperturaTurno,
    DatosCierreAdministrativo,
    FiltrosHistorialTurnos,
    IConsultaTurnosAbiertosRepository,
    ITurnoCajaRepository,
    ResultadoHistorialTurnos,
    TurnoAbiertoResumen,
    TurnoCaja,
    TurnoYaCerradoError,
} from '@warengine/core';
import type { TurnoCorteDetalleDto, TurnoHistorialItemDto } from '@warengine/contracts';
import { turnoCajaFromRow } from '../../mappers/facturacion/turno-caja.mapper.ts';

const MYSQL_CLAVE_DUPLICADA = 1062;

/** Según la versión de Drizzle, el error de mysql2 puede venir en error.cause. */
function esClaveDuplicada(error: unknown): boolean {
    const e = error as { errno?: number; cause?: { errno?: number } };
    return e?.errno === MYSQL_CLAVE_DUPLICADA || e?.cause?.errno === MYSQL_CLAVE_DUPLICADA;
}

const adminUsuarios = alias(usuarios, 'admin_usuarios');
const adminEmpleados = alias(empleados, 'admin_empleados');

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
                cantidadVentas: sql<number>`COALESCE((
                    SELECT COUNT(f.id_factura)
                    FROM facturas f
                    WHERE f.turno_caja_id = ${turnos_caja.id_turno_caja}
                      AND f.estado = 'emitida'
                ), 0)`,
                totalVentas: sql<string>`COALESCE((
                    SELECT SUM(f.total)
                    FROM facturas f
                    WHERE f.turno_caja_id = ${turnos_caja.id_turno_caja}
                      AND f.estado = 'emitida'
                ), 0)`,
                efectivoVendido: sql<string>`COALESCE((
                    SELECT SUM(fp.monto)
                    FROM factura_pagos fp
                    JOIN facturas f2 ON f2.id_factura = fp.factura_id
                    WHERE f2.turno_caja_id = ${turnos_caja.id_turno_caja}
                      AND fp.medio_pago = 'efectivo'
                      AND f2.estado = 'emitida'
                ), 0)`,
            })
            .from(turnos_caja)
            .innerJoin(usuarios, eq(turnos_caja.usuario_id, usuarios.id_usuario))
            .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
            .where(and(...condiciones))
            .orderBy(asc(turnos_caja.fecha_apertura));

        return filas.map((f) => {
            const fondoInicial = Number(f.fondoInicial);
            const efectivoVendido = Number(f.efectivoVendido);
            return {
                id: f.id,
                usuarioId: f.usuarioId,
                cajeroNombre: f.cajeroNombre ?? null,
                cajeroEmail: f.cajeroEmail,
                sucursalId: f.sucursalId,
                fondoInicial,
                fechaApertura: f.fechaApertura,
                cantidadVentas: Number(f.cantidadVentas),
                totalVentas: Number(f.totalVentas),
                efectivoEsperado: fondoInicial + efectivoVendido,
            };
        });
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
                tipo_cierre: 'normal',
            })
            .where(eq(turnos_caja.id_turno_caja, id));

        const turno = await this.findById(id);
        if (!turno) {
            throw new Error(`Turno no encontrado tras cierre: ${id}`);
        }
        return turno;
    }

    public async cerrarAdministrativo(datos: DatosCierreAdministrativo): Promise<TurnoCaja> {
        const updateValues: Record<string, unknown> = {
            tipo_cierre: 'administrativo',
            cerrado_por: datos.cerradoPor,
            motivo_cierre: datos.motivo,
            fecha_cierre: new Date(),
        };

        if (datos.fondoFinal !== undefined && datos.fondoFinal !== null) {
            updateValues.fondo_final = datos.fondoFinal.toFixed(2);
        } else {
            updateValues.fondo_final = null;
            updateValues.diferencia = null;
        }

        const [result] = await this.db
            .update(turnos_caja)
            .set(updateValues)
            .where(
                and(
                    eq(turnos_caja.id_turno_caja, datos.turnoId),
                    isNull(turnos_caja.fecha_cierre),
                ),
            );

        if (!result || (result as any).affectedRows === 0) {
            throw new TurnoYaCerradoError();
        }

        const turno = await this.findById(datos.turnoId);
        if (!turno) {
            throw new Error(`Turno no encontrado tras cierre administrativo: ${datos.turnoId}`);
        }
        return turno;
    }

    public async listarHistorial(filtros: FiltrosHistorialTurnos): Promise<ResultadoHistorialTurnos> {
        const condiciones: SQL[] = [
            isNotNull(turnos_caja.fecha_cierre),
            isNull(turnos_caja.deleted_at),
        ];

        if (filtros.sucursalId !== undefined) {
            condiciones.push(eq(turnos_caja.sucursal_id, filtros.sucursalId));
        } else if (filtros.sucursalIds !== undefined) {
            condiciones.push(inArray(turnos_caja.sucursal_id, filtros.sucursalIds));
        }

        if (filtros.usuarioId) {
            condiciones.push(eq(turnos_caja.usuario_id, filtros.usuarioId));
        }

        if (filtros.tipoCierre) {
            condiciones.push(eq(turnos_caja.tipo_cierre, filtros.tipoCierre));
        }

        if (filtros.conDiferencia) {
            condiciones.push(and(isNotNull(turnos_caja.diferencia), sql`${turnos_caja.diferencia} <> 0`)!);
        }

        if (filtros.desde) {
            const fDesde = new Date(filtros.desde);
            if (!isNaN(fDesde.getTime())) {
                condiciones.push(gte(turnos_caja.fecha_cierre, fDesde));
            }
        }

        if (filtros.hasta) {
            const fHasta = new Date(filtros.hasta);
            if (!isNaN(fHasta.getTime())) {
                if (filtros.hasta.length === 10) {
                    fHasta.setHours(23, 59, 59, 999);
                }
                condiciones.push(lte(turnos_caja.fecha_cierre, fHasta));
            }
        }

        const whereClause = and(...condiciones);

        const [conteo] = await this.db
            .select({ total: sql<number>`COUNT(*)` })
            .from(turnos_caja)
            .where(whereClause);

        const total = Number(conteo?.total ?? 0);
        const limite = Math.min(Math.max(filtros.limite ?? 20, 1), 100);
        const page = Math.max(filtros.page ?? 1, 1);
        const totalPaginas = Math.ceil(total / limite);
        const offset = (page - 1) * limite;

        const rows = await this.db
            .select({
                id: turnos_caja.id_turno_caja,
                usuarioId: turnos_caja.usuario_id,
                cajeroNombre: empleados.nombre,
                cajeroEmail: usuarios.email,
                sucursalId: turnos_caja.sucursal_id,
                sucursalNombre: sucursales.nombre,
                fondoInicial: turnos_caja.fondo_inicial,
                fondoFinal: turnos_caja.fondo_final,
                diferencia: turnos_caja.diferencia,
                fechaApertura: turnos_caja.fecha_apertura,
                fechaCierre: turnos_caja.fecha_cierre,
                tipoCierre: turnos_caja.tipo_cierre,
                cerradoPor: turnos_caja.cerrado_por,
                cerradoPorNombre: adminEmpleados.nombre,
                motivoCierre: turnos_caja.motivo_cierre,
                totalVendido: sql<string>`COALESCE((
                    SELECT SUM(f.total)
                    FROM facturas f
                    WHERE f.turno_caja_id = ${turnos_caja.id_turno_caja}
                      AND f.estado = 'emitida'
                ), 0)`,
                cantidadVentas: sql<number>`COALESCE((
                    SELECT COUNT(f.id_factura)
                    FROM facturas f
                    WHERE f.turno_caja_id = ${turnos_caja.id_turno_caja}
                      AND f.estado = 'emitida'
                ), 0)`,
                efectivoVendido: sql<string>`COALESCE((
                    SELECT SUM(fp.monto)
                    FROM factura_pagos fp
                    JOIN facturas f2 ON f2.id_factura = fp.factura_id
                    WHERE f2.turno_caja_id = ${turnos_caja.id_turno_caja}
                      AND fp.medio_pago = 'efectivo'
                      AND f2.estado = 'emitida'
                ), 0)`,
            })
            .from(turnos_caja)
            .innerJoin(usuarios, eq(turnos_caja.usuario_id, usuarios.id_usuario))
            .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
            .innerJoin(sucursales, eq(turnos_caja.sucursal_id, sucursales.id_sucursal))
            .leftJoin(adminUsuarios, eq(turnos_caja.cerrado_por, adminUsuarios.id_usuario))
            .leftJoin(adminEmpleados, eq(adminUsuarios.empleado_id, adminEmpleados.id_empleado))
            .where(whereClause)
            .orderBy(desc(turnos_caja.fecha_cierre))
            .limit(limite)
            .offset(offset);

        const items: TurnoHistorialItemDto[] = rows.map((r) => {
            const fondoInicial = Number(r.fondoInicial);
            const efectivoVendido = Number(r.efectivoVendido);
            const fondoFinal = r.fondoFinal !== null && r.fondoFinal !== undefined ? Number(r.fondoFinal) : null;
            const diferencia = r.diferencia !== null && r.diferencia !== undefined ? Number(r.diferencia) : null;

            return {
                id: r.id,
                usuarioId: r.usuarioId,
                cajeroNombre: r.cajeroNombre ?? null,
                cajeroEmail: r.cajeroEmail,
                sucursalId: r.sucursalId,
                sucursalNombre: r.sucursalNombre ?? null,
                cajaNombre: 'Caja 1',
                fondoInicial,
                fondoFinal,
                diferencia,
                fechaApertura: r.fechaApertura.toISOString(),
                fechaCierre: r.fechaCierre ? r.fechaCierre.toISOString() : '',
                tipoCierre: (r.tipoCierre as 'normal' | 'administrativo') ?? 'normal',
                cerradoPor: r.cerradoPor ?? null,
                cerradoPorNombre: r.cerradoPorNombre ?? null,
                motivoCierre: r.motivoCierre ?? null,
                totalVendido: Number(r.totalVendido),
                cantidadVentas: Number(r.cantidadVentas),
                efectivoEsperado: fondoInicial + efectivoVendido,
            };
        });

        return {
            items,
            total,
            totalPaginas,
            page,
            limite,
        };
    }

    public async obtenerCorte(turnoId: string): Promise<TurnoCorteDetalleDto | null> {
        const [turnoRow] = await this.db
            .select({
                id: turnos_caja.id_turno_caja,
                usuarioId: turnos_caja.usuario_id,
                cajeroNombre: empleados.nombre,
                cajeroEmail: usuarios.email,
                sucursalId: turnos_caja.sucursal_id,
                sucursalNombre: sucursales.nombre,
                fondoInicial: turnos_caja.fondo_inicial,
                fondoFinal: turnos_caja.fondo_final,
                diferencia: turnos_caja.diferencia,
                fechaApertura: turnos_caja.fecha_apertura,
                fechaCierre: turnos_caja.fecha_cierre,
                tipoCierre: turnos_caja.tipo_cierre,
                cerradoPor: turnos_caja.cerrado_por,
                cerradoPorNombre: adminEmpleados.nombre,
                motivoCierre: turnos_caja.motivo_cierre,
            })
            .from(turnos_caja)
            .innerJoin(usuarios, eq(turnos_caja.usuario_id, usuarios.id_usuario))
            .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
            .innerJoin(sucursales, eq(turnos_caja.sucursal_id, sucursales.id_sucursal))
            .leftJoin(adminUsuarios, eq(turnos_caja.cerrado_por, adminUsuarios.id_usuario))
            .leftJoin(adminEmpleados, eq(adminUsuarios.empleado_id, adminEmpleados.id_empleado))
            .where(eq(turnos_caja.id_turno_caja, turnoId))
            .limit(1);

        if (!turnoRow) return null;

        // Desglose de ventas por método de pago
        const pagosRows = await this.db
            .select({
                medioPago: factura_pagos.medio_pago,
                total: sql<string>`COALESCE(SUM(${factura_pagos.monto}), 0)`,
            })
            .from(factura_pagos)
            .innerJoin(facturas, eq(factura_pagos.factura_id, facturas.id_factura))
            .where(
                and(
                    eq(facturas.turno_caja_id, turnoId),
                    eq(facturas.estado, 'emitida'),
                ),
            )
            .groupBy(factura_pagos.medio_pago);

        const ventasPorMetodo = {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0,
            credito_corporativo: 0,
        };

        for (const row of pagosRows) {
            const medio = row.medioPago as keyof typeof ventasPorMetodo;
            if (medio in ventasPorMetodo) {
                ventasPorMetodo[medio] = Number(row.total);
            }
        }

        const [totalesVenta] = await this.db
            .select({
                cantidad: sql<number>`COUNT(${facturas.id_factura})`,
                total: sql<string>`COALESCE(SUM(${facturas.total}), 0)`,
            })
            .from(facturas)
            .where(
                and(
                    eq(facturas.turno_caja_id, turnoId),
                    eq(facturas.estado, 'emitida'),
                ),
            );

        const fondoInicial = Number(turnoRow.fondoInicial);
        const efectivoEsperado = fondoInicial + ventasPorMetodo.efectivo;
        const fondoFinal = turnoRow.fondoFinal !== null && turnoRow.fondoFinal !== undefined ? Number(turnoRow.fondoFinal) : null;
        const diferencia = turnoRow.diferencia !== null && turnoRow.diferencia !== undefined ? Number(turnoRow.diferencia) : null;

        return {
            id: turnoRow.id,
            usuarioId: turnoRow.usuarioId,
            cajeroNombre: turnoRow.cajeroNombre ?? null,
            cajeroEmail: turnoRow.cajeroEmail,
            sucursalId: turnoRow.sucursalId,
            sucursalNombre: turnoRow.sucursalNombre,
            cajaNombre: 'Caja 1',
            fondoInicial,
            fondoFinal,
            diferencia,
            fechaApertura: turnoRow.fechaApertura.toISOString(),
            fechaCierre: turnoRow.fechaCierre ? turnoRow.fechaCierre.toISOString() : null,
            tipoCierre: (turnoRow.tipoCierre as 'normal' | 'administrativo') ?? 'normal',
            cerradoPor: turnoRow.cerradoPor ?? null,
            cerradoPorNombre: turnoRow.cerradoPorNombre ?? null,
            motivoCierre: turnoRow.motivoCierre ?? null,
            cantidadVentas: Number(totalesVenta?.cantidad ?? 0),
            totalVentas: Number(totalesVenta?.total ?? 0),
            ventasPorMetodo,
            efectivoEsperado,
        };
    }
}
