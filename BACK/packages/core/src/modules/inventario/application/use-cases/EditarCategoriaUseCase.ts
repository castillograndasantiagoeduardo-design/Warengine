import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';
import { CategoriaNoEncontradaError } from '../../domain/errors/InventarioErrors.ts';

export interface EditarCategoriaRequest {
  id: number;
  nombre?: string;
  isActive?: boolean;
  usuarioId?: string | null;
  ip?: string | null;
}

export type EditarCategoriaResponse = Result<Categoria, DomainError>;

export class EditarCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: EditarCategoriaRequest): Promise<EditarCategoriaResponse> {
    const existente = await this.categoriaRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new CategoriaNoEncontradaError());
    }

    const { id, usuarioId, ip, ...cambios } = request;
    const actualizada = await this.categoriaRepository.actualizar(id, cambios);

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'EDITAR',
      entidad: 'categorias',
      entidadId: String(id),
      detalles: { cambios },
      ip,
    });

    return Result.ok(actualizada);
  }
}
