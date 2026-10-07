import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';
import { CategoriaNoEncontradaError } from '../../domain/errors/InventarioErrors.ts';

export interface EditarCategoriaRequest {
  id: number;
  nombre?: string;
  isActive?: boolean;
  actor: ActorAuditoria;
}

export type EditarCategoriaResponse = Result<Categoria, DomainError>;

export class EditarCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarCategoriaRequest): Promise<EditarCategoriaResponse> {
    const existente = await this.categoriaRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new CategoriaNoEncontradaError());
    }

    const { id, actor, ...cambios } = request;
    const actualizada = await this.categoriaRepository.actualizar(id, cambios);

    const claves = (Object.keys(cambios) as Array<keyof typeof cambios>).filter(
      (clave) => cambios[clave] !== undefined,
    );
    const antes: Record<string, unknown> = {};
    const despues: Record<string, unknown> = {};
    for (const clave of claves) {
      antes[clave] = existente[clave];
      despues[clave] = actualizada[clave];
    }

    await this.auditor.registrar({
      actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS,
      entidadId: String(id),
      detalles: { antes, despues },
    });

    return Result.ok(actualizada);
  }
}
