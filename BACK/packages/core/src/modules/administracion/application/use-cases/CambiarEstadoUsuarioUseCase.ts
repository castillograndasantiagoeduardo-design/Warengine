import { Result, DomainError } from '@warengine/shared-kernel';
import { IGestionUsuarioRepository } from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { UsuarioGestionado } from '../../domain/entities/UsuarioGestionado.ts';
import {
  UsuarioNoEncontradoError,
  UltimoSuperAdminError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface CambiarEstadoUsuarioRequest {
  usuarioId: string;
  isActive: boolean;
}

export type CambiarEstadoUsuarioResponse = Result<UsuarioGestionado, DomainError>;

export class CambiarEstadoUsuarioUseCase {
  constructor(private readonly usuarioRepository: IGestionUsuarioRepository) {}

  public async execute(request: CambiarEstadoUsuarioRequest): Promise<CambiarEstadoUsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new UsuarioNoEncontradoError());

    if (usuario.isActive === request.isActive) return Result.ok(usuario);

    if (!request.isActive && usuario.esSuperAdmin) {
      const total = await this.usuarioRepository.contarSuperAdminsActivos();
      if (total <= 1) return Result.fail(new UltimoSuperAdminError());
    }

    await this.usuarioRepository.actualizarEstado(usuario.id, request.isActive, new Date());

    const actualizado = await this.usuarioRepository.findById(usuario.id);
    return Result.ok(actualizado ?? usuario);
  }
}