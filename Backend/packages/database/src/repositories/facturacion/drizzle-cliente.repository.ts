import { and, eq, isNull, like, or, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { clientes } from '../../schema/facturacion.schema.ts';
import {
    Cliente,
    DatosActualizarCliente,
    DatosCliente,
    DatosDecisionCreditoCliente,
    FiltrosClientes,
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
                ) as SQL,
            );
        }

        const rows = await this.db
            .select()
            .from(clientes)
            .where(and(...condiciones))
            .orderBy(clientes.nombre_razon_social)
            .limit(filtros.limite);
        return rows.map(clienteFromRow);
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
        return row ? clienteFromRow(row) : null;
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
        return rows.map(clienteFromRow);
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