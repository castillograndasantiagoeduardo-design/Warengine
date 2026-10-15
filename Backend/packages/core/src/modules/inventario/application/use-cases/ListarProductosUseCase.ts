import { Result, DomainError, type ResultadoPaginado } from '@warengine/shared-kernel';
import { IProductoRepository, FiltrosListarProductos } from '../../domain/repositories/IProductoRepository.ts';
import { ProductoResponse } from '@warengine/contracts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { toProductoResponse } from '../mappers/producto-response.mapper.ts';

export interface ListarProductosRequest extends FiltrosListarProductos {
  actor?: ActorAuditoria;
}

export type ListarProductosResponse = Result<ResultadoPaginado<ProductoResponse>, DomainError>;

export class ListarProductosUseCase {
  constructor(private readonly productoRepository: IProductoRepository) {}

  public async execute(request: ListarProductosRequest): Promise<ListarProductosResponse> {
    const resultado = await this.productoRepository.listar(request);
    const items = resultado.items.map((prod) => toProductoResponse(prod, request.actor?.permisos));
    return Result.ok({
      ...resultado,
      items,
    });
  }
}
