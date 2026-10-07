import { DomainError, Result } from '@warengine/shared-kernel';
import { Cliente, TipoDocumentoCliente } from '../../domain/entities/Cliente.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';

export interface BuscarClientesRequest {
    texto?: string;
    tipoDocumento?: TipoDocumentoCliente;
    limite?: number;
}

export type BuscarClientesResponse = Result<Cliente[], DomainError>;

export class BuscarClientesUseCase {
    constructor(private readonly clienteRepository: IClienteRepository) { }

    public async execute(request: BuscarClientesRequest = {}): Promise<BuscarClientesResponse> {
        const texto = request.texto?.trim();
        const clientes = await this.clienteRepository.buscar({
            texto: texto ? texto : undefined,
            tipoDocumento: request.tipoDocumento,
            limite: Math.min(Math.max(request.limite ?? 20, 1), 50),
        });
        return Result.ok(clientes);
    }
}