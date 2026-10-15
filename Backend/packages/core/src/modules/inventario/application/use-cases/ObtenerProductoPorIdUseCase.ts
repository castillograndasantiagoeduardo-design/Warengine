import { Result, DomainError } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ProductoNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';
import { ProductoResponse } from '@warengine/contracts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { toProductoResponse } from '../mappers/producto-response.mapper.ts';

export interface ObtenerProductoPorIdRequest {
  id: string;
  actor?: ActorAuditoria;
}

export type ObtenerProductoPorIdResponse = Result<ProductoResponse, DomainError>;

export class ObtenerProductoPorIdUseCase {
  constructor(private readonly productoRepository: IProductoRepository) {}

  public async execute(request: ObtenerProductoPorIdRequest): Promise<ObtenerProductoPorIdResponse> {
    const producto = await this.productoRepository.findById(request.id);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }
    return Result.ok(toProductoResponse(producto, request.actor?.permisos));
  }
}
