import { Result, DomainError } from '@warengine/shared-kernel';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { Sucursal } from '../../domain/entities/Sucursal.ts';

export type ListarSucursalesResponse = Result<Sucursal[], DomainError>;

export class ListarSucursalesUseCase {
  constructor(private readonly sucursalRepository: ISucursalRepository) {}

  public async execute(): Promise<ListarSucursalesResponse> {
    return Result.ok(await this.sucursalRepository.listar());
  }
}