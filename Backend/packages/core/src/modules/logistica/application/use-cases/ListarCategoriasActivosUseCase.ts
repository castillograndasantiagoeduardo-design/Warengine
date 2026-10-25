import { ResultadoPaginado } from '@warengine/shared-kernel';
import { CategoriaActivo } from '../../domain/entities/CategoriaActivo.ts';
import { ICategoriaActivoRepository, FiltrosListarCategoriasActivos } from '../../domain/repositories/ICategoriaActivoRepository.ts';

export class ListarCategoriasActivosUseCase {
  constructor(
    private readonly categoriaActivoRepository: ICategoriaActivoRepository,
  ) {}

  public async execute(filtros: FiltrosListarCategoriasActivos): Promise<ResultadoPaginado<CategoriaActivo>> {
    return await this.categoriaActivoRepository.listar(filtros);
  }
}
