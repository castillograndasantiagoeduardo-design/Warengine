import { Result, DomainError } from '@warengine/shared-kernel';
import {
  IProveedorRepository,
  FiltrosListarProveedores,
} from '../../domain/repositories/IProveedorRepository.ts';
import { ResultadoPaginado } from '../../domain/repositories/ICategoriaRepository.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';

export type ListarProveedoresRequest = FiltrosListarProveedores;
export type ListarProveedoresResponse = Result<ResultadoPaginado<Proveedor>, DomainError>;

export class ListarProveedoresUseCase {
  constructor(private readonly proveedorRepository: IProveedorRepository) {}

  public async execute(request: ListarProveedoresRequest): Promise<ListarProveedoresResponse> {
    const paginado = await this.proveedorRepository.listar(request);
    return Result.ok(paginado);
  }
}
