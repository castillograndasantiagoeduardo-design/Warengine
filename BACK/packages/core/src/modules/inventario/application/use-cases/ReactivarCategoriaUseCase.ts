import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';
import { CategoriaNoEncontradaError } from '../../domain/errors/InventarioErrors.ts';

export interface ReactivarCategoriaRequest {
  id: number;
  usuarioId?: string | null;
  ip?: string | null;
}

export type ReactivarCategoriaResponse = Result<Categoria, DomainError>;

export class ReactivarCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: ReactivarCategoriaRequest): Promise<ReactivarCategoriaResponse> {
    const existente = await this.categoriaRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new CategoriaNoEncontradaError());
    }

    const reactivada = await this.categoriaRepository.cambiarEstado(request.id, true);

    await this.auditoriaService.registrar({
      usuarioId: request.usuarioId,
      accion: 'REACTIVAR',
      entidad: 'categorias',
      entidadId: String(request.id),
      detalles: { isActive: true },
      ip: request.ip,
    });

    return Result.ok(reactivada);
  }
}
