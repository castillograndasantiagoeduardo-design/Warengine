import { Result, DomainError } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { Producto } from '../../domain/entities/Producto.ts';
import { ProductoNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';

export interface ObtenerProductoPorIdRequest {
  id: string;
}

export type ObtenerProductoPorIdResponse = Result<Producto, DomainError>;

export class ObtenerProductoPorIdUseCase {
  constructor(private readonly productoRepository: IProductoRepository) {}

  public async execute(request: ObtenerProductoPorIdRequest): Promise<ObtenerProductoPorIdResponse> {
    const producto = await this.productoRepository.findById(request.id);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }
    return Result.ok(producto);
  }
}
