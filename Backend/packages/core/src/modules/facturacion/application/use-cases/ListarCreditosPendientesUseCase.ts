import { DomainError, Result } from '@warengine/shared-kernel';
import { Cliente } from '../../domain/entities/Cliente.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';

export type ListarCreditosPendientesResponse = Result<Cliente[], DomainError>;

export class ListarCreditosPendientesUseCase {
  constructor(private readonly clienteRepository: IClienteRepository) {}

  public async execute(): Promise<ListarCreditosPendientesResponse> {
    if (!this.clienteRepository.listarCreditosPendientes) {
      return Result.ok([]);
    }
    const pendientes = await this.clienteRepository.listarCreditosPendientes();
    return Result.ok(pendientes);
  }
}
