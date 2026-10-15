import { DomainError, Result } from '@warengine/shared-kernel';
import { Cliente } from '../../domain/entities/Cliente.ts';
import { ClienteNoEncontradoError } from '../../domain/errors/FacturacionErrors.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';

export interface ObtenerClientePorIdRequest {
    id: string;
}

export type ObtenerClientePorIdResponse = Result<Cliente, DomainError>;

export class ObtenerClientePorIdUseCase {
    constructor(private readonly clienteRepository: IClienteRepository) { }

    public async execute(request: ObtenerClientePorIdRequest): Promise<ObtenerClientePorIdResponse> {
        const cliente = await this.clienteRepository.findById(request.id);
        if (!cliente) {
            return Result.fail(new ClienteNoEncontradoError());
        }
        return Result.ok(cliente);
    }
}
