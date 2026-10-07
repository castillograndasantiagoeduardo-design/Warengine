import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';
import { CategoriaNoEncontradaError } from '../../domain/errors/InventarioErrors.ts';

export interface InactivarCategoriaRequest {
  id: number;
  usuarioId?: string | null;
  ip?: string | null;
}

export type InactivarCategoriaResponse = Result<Categoria, DomainError>;

export class InactivarCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: InactivarCategoriaRequest): Promise<InactivarCategoriaResponse> {
    const existente = await this.categoriaRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new CategoriaNoEncontradaError());
    }

    const inactivada = await this.categoriaRepository.cambiarEstado(request.id, false);

    await this.auditoriaService.registrar({
      usuarioId: request.usuarioId,
      accion: 'INACTIVAR',
      entidad: 'categorias',
      entidadId: String(request.id),
      detalles: { isActive: false },
      ip: request.ip,
    });

    return Result.ok(inactivada);
  }
}
