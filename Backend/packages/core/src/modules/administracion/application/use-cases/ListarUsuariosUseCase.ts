import { Result, DomainError } from '@warengine/shared-kernel';
import {
  IGestionUsuarioRepository,
  FiltrosUsuarios,
} from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { UsuarioGestionado } from '../../domain/entities/UsuarioGestionado.ts';

/** RF-ADM-C5 / C16: filtros combinables por rol, sucursal, estado y texto, con paginación. */
export interface ListarUsuariosRequest extends FiltrosUsuarios {
  pagina?: number;
  limite?: number;
}

/** Misma forma de página que la auditoría: { items, total, pagina, limite, totalPaginas }. */
export interface PaginaUsuarios {
  items: UsuarioGestionado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export type ListarUsuariosResponse = Result<PaginaUsuarios, DomainError>;

const PAGINA_POR_DEFECTO = 1;
const LIMITE_POR_DEFECTO = 20;

export class ListarUsuariosUseCase {
  constructor(private readonly usuarioRepository: IGestionUsuarioRepository) {}

  public async execute(request: ListarUsuariosRequest = {}): Promise<ListarUsuariosResponse> {
    const { pagina = PAGINA_POR_DEFECTO, limite = LIMITE_POR_DEFECTO, ...filtros } = request;
    const { items, total } = await this.usuarioRepository.listarPaginado(filtros, { pagina, limite });

    return Result.ok({
      items,
      total,
      pagina,
      limite,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    });
  }
}
