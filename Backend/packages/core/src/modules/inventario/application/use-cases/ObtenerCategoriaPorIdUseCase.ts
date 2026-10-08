import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';
import { CategoriaNoEncontradaError } from '../../domain/errors/InventarioErrors.ts';

export interface ObtenerCategoriaPorIdRequest {
  id: number;
}

export type ObtenerCategoriaPorIdResponse = Result<Categoria, DomainError>;

export class ObtenerCategoriaPorIdUseCase {
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  public async execute(request: ObtenerCategoriaPorIdRequest): Promise<ObtenerCategoriaPorIdResponse> {
    const categoria = await this.categoriaRepository.findById(request.id);
    if (!categoria) {
      return Result.fail(new CategoriaNoEncontradaError());
    }
    return Result.ok(categoria);
  }
}
