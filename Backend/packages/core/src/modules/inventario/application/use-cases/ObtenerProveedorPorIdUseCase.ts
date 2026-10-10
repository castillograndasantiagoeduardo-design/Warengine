import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';
import { ProveedorNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';

export interface ObtenerProveedorPorIdRequest {
  id: number;
}

export type ObtenerProveedorPorIdResponse = Result<Proveedor, DomainError>;

export class ObtenerProveedorPorIdUseCase {
  constructor(private readonly proveedorRepository: IProveedorRepository) {}

  public async execute(request: ObtenerProveedorPorIdRequest): Promise<ObtenerProveedorPorIdResponse> {
    const proveedor = await this.proveedorRepository.findById(request.id);
    if (!proveedor) {
      return Result.fail(new ProveedorNoEncontradoError());
    }
    return Result.ok(proveedor);
  }
}
