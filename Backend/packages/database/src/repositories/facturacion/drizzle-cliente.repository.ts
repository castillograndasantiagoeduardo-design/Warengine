import { and, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { clientes } from '../../schema/facturacion.schema.ts';
import {
    Cliente,
    DatosCliente,
    FiltrosClientes,
    IClienteRepository,
    TipoDocumentoCliente,
} from '@warengine/core';
import { clienteFromRow } from '../../mappers/facturacion/cliente.mapper.ts';

const MYSQL_CLAVE_DUPLICADA = 1062;

/** Según la versión de Drizzle, el error de mysql2 puede venir en error.cause. */
function esClaveDuplicada(error: unknown): boolean {
    const e = error as { errno?: number; cause?: { errno?: number } };
    return e?.errno === MYSQL_CLAVE_DUPLICADA || e?.cause?.errno === MYSQL_CLAVE_DUPLICADA;
}

/** Evita que % y _ escritos por el usuario actúen como comodines de LIKE. */
function escaparLike(texto: string): string {
    return texto.replace(/[\\%_]/g, '\\$&');
}

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

    private async findById(id: string): Promise<Cliente | null> {
        const [row] = await this.db
            .select()
            .from(clientes)
            .where(eq(clientes.id_cliente, id))
            .limit(1);
        return row ? clienteFromRow(row) : null;
    }
}