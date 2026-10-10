import { Result, DomainError, type ResultadoPaginado } from '@warengine/shared-kernel';
import { IProductoRepository, FiltrosListarProductos } from '../../domain/repositories/IProductoRepository.ts';
import { Producto } from '../../domain/entities/Producto.ts';

export type ListarProductosRequest = FiltrosListarProductos;
export type ListarProductosResponse = Result<ResultadoPaginado<Producto>, DomainError>;

export class ListarProductosUseCase {
  constructor(private readonly productoRepository: IProductoRepository) {}

  public async execute(request: ListarProductosRequest): Promise<ListarProductosResponse> {
    const resultado = await this.productoRepository.listar(request);
    return Result.ok(resultado);
  }
}
