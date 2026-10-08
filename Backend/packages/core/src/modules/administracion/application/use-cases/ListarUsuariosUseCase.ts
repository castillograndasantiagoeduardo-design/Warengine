import { Result, DomainError } from '@warengine/shared-kernel';
import {
  IGestionUsuarioRepository,
  FiltrosUsuarios,
} from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { UsuarioGestionado } from '../../domain/entities/UsuarioGestionado.ts';

export type ListarUsuariosResponse = Result<UsuarioGestionado[], DomainError>;

export class ListarUsuariosUseCase {
  constructor(private readonly usuarioRepository: IGestionUsuarioRepository) {}

  public async execute(filtros: FiltrosUsuarios = {}): Promise<ListarUsuariosResponse> {
    return Result.ok(await this.usuarioRepository.listar(filtros));
  }
}