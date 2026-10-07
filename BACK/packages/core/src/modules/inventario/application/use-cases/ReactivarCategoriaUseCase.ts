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

export interface ReactivarCategoriaRequest {
  id: number;
  actor: ActorAuditoria;
}

export type ReactivarCategoriaResponse = Result<Categoria, DomainError>;

export class ReactivarCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: ReactivarCategoriaRequest): Promise<ReactivarCategoriaResponse> {
    const existente = await this.categoriaRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new CategoriaNoEncontradaError());
    }

    const reactivada = await this.categoriaRepository.cambiarEstado(request.id, true);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.ACTIVAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS,
      entidadId: String(request.id),
      detalles: {
        antes: { isActive: existente.isActive },
        despues: { isActive: true },
      },
    });

    return Result.ok(reactivada);
  }
}
