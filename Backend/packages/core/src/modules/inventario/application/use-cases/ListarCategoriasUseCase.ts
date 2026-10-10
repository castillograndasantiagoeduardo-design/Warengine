import { Result, DomainError } from '@warengine/shared-kernel';
import {
  ICategoriaRepository,
  FiltrosListarCategorias,
  ResultadoPaginado,
} from '../../domain/repositories/ICategoriaRepository.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';

export type ListarCategoriasRequest = FiltrosListarCategorias;
export type ListarCategoriasResponse = Result<ResultadoPaginado<Categoria>, DomainError>;

export class ListarCategoriasUseCase {
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  public async execute(request: ListarCategoriasRequest): Promise<ListarCategoriasResponse> {
    const paginado = await this.categoriaRepository.listar(request);
    return Result.ok(paginado);
  }
}
