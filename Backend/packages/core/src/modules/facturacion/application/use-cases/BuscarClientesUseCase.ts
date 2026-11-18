import { DomainError, Result } from '@warengine/shared-kernel';
import { Cliente, TipoCliente, TipoDocumentoCliente } from '../../domain/entities/Cliente.ts';
import { ClientesPaginadosResultado, IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';

export interface BuscarClientesRequest {
    texto?: string;
    tipoDocumento?: TipoDocumentoCliente;
    tipoCliente?: TipoCliente;
    creditoHabilitado?: boolean;
    estado?: 'activo' | 'inactivo';
    page?: number;
    limite?: number;
    offset?: number;
    paginado?: boolean;
}

export type BuscarClientesResponse = Result<Cliente[] | ClientesPaginadosResultado, DomainError>;

export class BuscarClientesUseCase {
    constructor(private readonly clienteRepository: IClienteRepository) { }

    public async execute(request: BuscarClientesRequest = {}): Promise<BuscarClientesResponse> {
        const texto = request.texto?.trim() || undefined;

        if (request.page !== undefined || request.paginado === true) {
            const page = Math.max(request.page ?? 1, 1);
            const limite = Math.min(Math.max(request.limite ?? 20, 1), 100);
            const offset = request.offset !== undefined ? Math.max(request.offset, 0) : (page - 1) * limite;

            if (this.clienteRepository.buscarPaginado) {
                const resultado = await this.clienteRepository.buscarPaginado({
                    texto,
                    tipoDocumento: request.tipoDocumento,
                    tipoCliente: request.tipoCliente,
                    creditoHabilitado: request.creditoHabilitado,
                    estado: request.estado,
                    page,
                    limite,
                    offset,
                });
                return Result.ok(resultado);
            }

            const clientes = await this.clienteRepository.buscar({
                texto,
                tipoDocumento: request.tipoDocumento,
                limite,
            });
            return Result.ok({
                items: clientes,
                total: clientes.length,
                totalPaginas: 1,
                page,
                limite,
                resumen: {
                    total: clientes.length,
                    b2b: clientes.filter((c) => c.tipoCliente === 'B2B').length,
                    b2c: clientes.filter((c) => c.tipoCliente === 'B2C').length,
                    conCredito: clientes.filter((c) => c.creditoHabilitado).length,
                    saldoPendienteTotal: 0,
                },
            });
        }

        const clientes = await this.clienteRepository.buscar({
            texto,
            tipoDocumento: request.tipoDocumento,
            limite: Math.min(Math.max(request.limite ?? 20, 1), 100),
        });
        return Result.ok(clientes);
    }
}