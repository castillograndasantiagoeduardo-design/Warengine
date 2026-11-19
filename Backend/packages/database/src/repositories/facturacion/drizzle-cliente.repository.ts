import { and, eq, inArray, isNotNull, isNull, like, or, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { clientes, factura_pagos, facturas } from '../../schema/facturacion.schema.ts';
import {
    Cliente,
    ClientesPaginadosResultado,
    DatosActualizarCliente,
    DatosCliente,
    DatosDecisionCreditoCliente,
    FiltrosClientes,
    FiltrosClientesPaginado,
    IClienteRepository,
    TipoDocumentoCliente,
} from '@warengine/core';
import { clienteFromRow } from '../../mappers/facturacion/cliente.mapper.ts';
import { esClaveDuplicada, escaparLike } from '../../errors/mysql-error-translator.ts';

export class DrizzleClienteRepository implements IClienteRepository {
    constructor(private readonly db: Database) { }

    public async buscar(filtros: FiltrosClientes): Promise<Cliente[]> {
        const condiciones: SQL[] = [isNull(clientes.deleted_at)];
        if (filtros.tipoDocumento) {
            condiciones.push(eq(clientes.tipo_documento, filtros.tipoDocumento));
        }
        if (filtros.texto) {
            const patron = `%${escaparLike(filtros.texto)}%`;
            condiciones.push(
                or(
                    like(clientes.nombre_razon_social, patron),
                    like(clientes.numero_documento, patron),
                    like(clientes.email, patron),
                    like(clientes.telefono, patron),
                ) as SQL,
            );
        }

        const rows = await this.db
            .select()
            .from(clientes)
            .where(and(...condiciones))
            .orderBy(clientes.nombre_razon_social)
            .limit(filtros.limite);
        return rows.map((r) => clienteFromRow(r));
    }

    public async buscarPaginado(filtros: FiltrosClientesPaginado): Promise<ClientesPaginadosResultado> {
        const condiciones: SQL[] = [];

        if (filtros.estado === 'inactivo') {
            condiciones.push(isNotNull(clientes.deleted_at));
        } else {
            condiciones.push(isNull(clientes.deleted_at));
        }

        if (filtros.tipoDocumento) {
            condiciones.push(eq(clientes.tipo_documento, filtros.tipoDocumento));
        }
        if (filtros.tipoCliente) {
            condiciones.push(eq(clientes.tipo_cliente, filtros.tipoCliente));
        }
        if (filtros.creditoHabilitado !== undefined) {
            condiciones.push(eq(clientes.credito_habilitado, filtros.creditoHabilitado ? 1 : 0));
        }
        if (filtros.texto) {
            const patron = `%${escaparLike(filtros.texto)}%`;
            condiciones.push(
                or(
                    like(clientes.nombre_razon_social, patron),
                    like(clientes.numero_documento, patron),
                    like(clientes.email, patron),
                    like(clientes.telefono, patron),
                ) as SQL,
            );
        }

        const [countRow] = await this.db
            .select({ total: sql<number>`COUNT(*)` })
            .from(clientes)
            .where(and(...condiciones));
        const total = Number(countRow?.total ?? 0);

        const [resumenRow] = await this.db
            .select({
                total: sql<number>`COUNT(*)`,
                b2b: sql<number>`COALESCE(SUM(CASE WHEN ${clientes.tipo_cliente} = 'B2B' THEN 1 ELSE 0 END), 0)`,
                b2c: sql<number>`COALESCE(SUM(CASE WHEN ${clientes.tipo_cliente} = 'B2C' THEN 1 ELSE 0 END), 0)`,
                conCredito: sql<number>`COALESCE(SUM(CASE WHEN ${clientes.credito_habilitado} = 1 THEN 1 ELSE 0 END), 0)`,
            })
            .from(clientes)
            .where(isNull(clientes.deleted_at));

        let saldoPendienteTotal = 0;
        try {
            const [saldoRow] = await this.db
                .select({
                    saldo: sql<number>`COALESCE(SUM(${factura_pagos.monto}), 0)`,
                })
                .from(factura_pagos)
                .innerJoin(facturas, eq(factura_pagos.factura_id, facturas.id_factura))
                .where(
                    and(
                        eq(factura_pagos.medio_pago, 'credito_corporativo'),
                        eq(facturas.estado, 'emitida'),
                        isNull(facturas.deleted_at),
                    ),
                );
            saldoPendienteTotal = Number(saldoRow?.saldo ?? 0);
        } catch {
            saldoPendienteTotal = 0;
        }

        const totalPaginas = Math.max(1, Math.ceil(total / filtros.limite));

        if (total === 0) {
            return {
                items: [],
                total: 0,
                totalPaginas: 1,
                page: filtros.page,
                limite: filtros.limite,
                resumen: {
                    total: Number(resumenRow?.total ?? 0),
                    b2b: Number(resumenRow?.b2b ?? 0),
                    b2c: Number(resumenRow?.b2c ?? 0),
                    conCredito: Number(resumenRow?.conCredito ?? 0),
                    saldoPendienteTotal,
                },
            };
        }

        const rows = await this.db
            .select()
            .from(clientes)
            .where(and(...condiciones))
            .orderBy(clientes.nombre_razon_social)
            .limit(filtros.limite)
            .offset(filtros.offset);

        const ids = rows.map((r) => r.id_cliente);
        const saldoPorCliente = new Map<string, number>();
        const comprasPorCliente = new Map<string, number>();

        if (ids.length > 0) {
            try {
                const facturaStats = await this.db
                    .select({
                        clienteId: facturas.cliente_id,
                        totalCompras: sql<number>`COALESCE(SUM(${facturas.total}), 0)`,
                    })
                    .from(facturas)
                    .where(
                        and(
                            inArray(facturas.cliente_id, ids),
                            eq(facturas.estado, 'emitida'),
                            isNull(facturas.deleted_at),
                        ),
                    )
                    .groupBy(facturas.cliente_id);

                for (const stat of facturaStats) {
                    if (stat.clienteId) {
                        comprasPorCliente.set(stat.clienteId, Number(stat.totalCompras));
                    }
                }

                const creditoStats = await this.db
                    .select({
                        clienteId: facturas.cliente_id,
                        saldoCredito: sql<number>`COALESCE(SUM(${factura_pagos.monto}), 0)`,
                    })
                    .from(factura_pagos)
                    .innerJoin(facturas, eq(factura_pagos.factura_id, facturas.id_factura))
                    .where(
                        and(
                            inArray(facturas.cliente_id, ids),
                            eq(factura_pagos.medio_pago, 'credito_corporativo'),
                            eq(facturas.estado, 'emitida'),
                            isNull(facturas.deleted_at),
                        ),
                    )
                    .groupBy(facturas.cliente_id);

                for (const stat of creditoStats) {
                    if (stat.clienteId) {
                        saldoPorCliente.set(stat.clienteId, Number(stat.saldoCredito));
                    }
                }
            } catch {
                // Sin facturas registradas
            }
        }

        const items = rows.map((r) =>
            clienteFromRow(
                r,
                saldoPorCliente.get(r.id_cliente) ?? 0,
                comprasPorCliente.get(r.id_cliente) ?? 0,
            ),
        );

        return {
            items,
            total,
            totalPaginas,
            page: filtros.page,
            limite: filtros.limite,
            resumen: {
                total: Number(resumenRow?.total ?? 0),
                b2b: Number(resumenRow?.b2b ?? 0),
                b2c: Number(resumenRow?.b2c ?? 0),
                conCredito: Number(resumenRow?.conCredito ?? 0),
                saldoPendienteTotal,
            },
        };
    }

    public async findByDocumento(
        tipo: TipoDocumentoCliente,
        numero: string,
    ): Promise<Cliente | null> {
        const [row] = await this.db
            .select()
            .from(clientes)
            .where(
                and(
                    eq(clientes.tipo_documento, tipo),
                    eq(clientes.numero_documento, numero),
                    isNull(clientes.deleted_at),
                ),
            )
            .limit(1);
        return row ? clienteFromRow(row) : null;
    }

    public async crear(datos: DatosCliente): Promise<Cliente> {
        const id = crypto.randomUUID();
        try {
            await this.db.insert(clientes).values({
                id_cliente: id,
                tipo_documento: datos.tipoDocumento,
                numero_documento: datos.numeroDocumento,
                nombre_razon_social: datos.nombreRazonSocial,
                tipo_cliente: datos.tipoCliente,
                email: datos.email,
                telefono: datos.telefono,
                direccion: datos.direccion,
                credito_habilitado: 0,
                ganancia_neta_mensual:
                    datos.gananciaNetaMensual !== undefined && datos.gananciaNetaMensual !== null
                        ? datos.gananciaNetaMensual.toFixed(2)
                        : null,
                antiguedad_empresa_meses: datos.antiguedadEmpresaMeses ?? null,
                plazo_credito_dias: datos.plazoCreditoDias ?? 30,
                cupo_credito_sugerido: (datos.cupoCreditoSugerido ?? 0).toFixed(2),
                cupo_credito_aprobado: '0.00',
                cupo_credito_utilizado: '0.00',
                nivel_riesgo_credito: datos.nivelRiesgoCredito ?? null,
                estado_credito: datos.estadoCredito ?? 'sin_solicitud',
                observacion_financiera: datos.observacionFinanciera ?? null,
            });
        } catch (error) {
            // Dos cajeros registrando el mismo documento a la vez: gana el primero y
            // el segundo reutiliza ese cliente (misma regla de RF-FMC-D2).
            if (esClaveDuplicada(error)) {
                const existente = await this.findByDocumento(datos.tipoDocumento, datos.numeroDocumento);
                if (existente) return existente;
            }
            throw error;
        }
        return (await this.findById(id)) as Cliente;
    }

    public async findById(id: string): Promise<Cliente | null> {
        const [row] = await this.db
            .select()
            .from(clientes)
            .where(and(eq(clientes.id_cliente, id), isNull(clientes.deleted_at)))
            .limit(1);
        if (!row) return null;

        let totalCompras = 0;
        let saldoPendiente = 0;
        try {
            const [comprasRow] = await this.db
                .select({ total: sql<number>`COALESCE(SUM(${facturas.total}), 0)` })
                .from(facturas)
                .where(and(eq(facturas.cliente_id, id), eq(facturas.estado, 'emitida'), isNull(facturas.deleted_at)));
            totalCompras = Number(comprasRow?.total ?? 0);

            const [saldoRow] = await this.db
                .select({ saldo: sql<number>`COALESCE(SUM(${factura_pagos.monto}), 0)` })
                .from(factura_pagos)
                .innerJoin(facturas, eq(factura_pagos.factura_id, facturas.id_factura))
                .where(
                    and(
                        eq(facturas.cliente_id, id),
                        eq(factura_pagos.medio_pago, 'credito_corporativo'),
                        eq(facturas.estado, 'emitida'),
                        isNull(facturas.deleted_at),
                    ),
                );
            saldoPendiente = Number(saldoRow?.saldo ?? 0);
        } catch {
            // Sin facturas registradas
        }

        return clienteFromRow(row, saldoPendiente, totalCompras);
    }

    public async actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente> {
        const valores: Record<string, unknown> = {};
        if (datos.nombreRazonSocial !== undefined) {
            valores.nombre_razon_social = datos.nombreRazonSocial;
        }
        if (datos.email !== undefined) {
            valores.email = datos.email;
        }
        if (datos.telefono !== undefined) {
            valores.telefono = datos.telefono;
        }
        if (datos.direccion !== undefined) {
            valores.direccion = datos.direccion;
        }
        if (datos.creditoHabilitado !== undefined) {
            valores.credito_habilitado = datos.creditoHabilitado ? 1 : 0;
        }

        if (Object.keys(valores).length > 0) {
            await this.db
                .update(clientes)
                .set(valores)
                .where(eq(clientes.id_cliente, id));
        }

        const actualizado = await this.findById(id);
        if (!actualizado) {
            throw new Error(`Cliente no encontrado tras actualización: ${id}`);
        }
        return actualizado;
    }

    public async decidirCredito(id: string, datos: DatosDecisionCreditoCliente): Promise<Cliente> {
        await this.db
            .update(clientes)
            .set({
                credito_habilitado: datos.creditoHabilitado ? 1 : 0,
                estado_credito: datos.estadoCredito,
                cupo_credito_aprobado: datos.cupoCreditoAprobado.toFixed(2),
                plazo_credito_dias: datos.plazoCreditoDias ?? 30,
                credito_aprobado_por: datos.creditoAprobadoPor,
                credito_aprobado_en: datos.creditoAprobadoEn,
                motivo_decision_credito: datos.motivoDecisionCredito,
            })
            .where(eq(clientes.id_cliente, id));

        const actualizado = await this.findById(id);
        if (!actualizado) {
            throw new Error(`Cliente no encontrado tras decisión de crédito: ${id}`);
        }
        return actualizado;
    }

    public async listarCreditosPendientes(): Promise<Cliente[]> {
        const rows = await this.db
            .select()
            .from(clientes)
            .where(
                and(
                    eq(clientes.tipo_cliente, 'B2B'),
                    eq(clientes.estado_credito, 'pendiente_aprobacion'),
                    isNull(clientes.deleted_at),
                ),
            )
            .orderBy(clientes.nombre_razon_social);
        return rows.map((r) => clienteFromRow(r));
    }

    public async registrarConsumoCredito(id: string, monto: number): Promise<void> {
        await this.db
            .update(clientes)
            .set({
                cupo_credito_utilizado: sql`${clientes.cupo_credito_utilizado} + ${monto.toFixed(2)}`,
            })
            .where(eq(clientes.id_cliente, id));
    }
}