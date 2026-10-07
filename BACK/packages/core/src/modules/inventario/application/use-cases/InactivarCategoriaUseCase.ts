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

export interface InactivarCategoriaRequest {
  id: number;
  actor: ActorAuditoria;
}

export type InactivarCategoriaResponse = Result<Categoria, DomainError>;

export class InactivarCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: InactivarCategoriaRequest): Promise<InactivarCategoriaResponse> {
    const existente = await this.categoriaRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new CategoriaNoEncontradaError());
    }

    const inactivada = await this.categoriaRepository.cambiarEstado(request.id, false);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.INACTIVAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS,
      entidadId: String(request.id),
      detalles: {
        antes: { isActive: existente.isActive },
        despues: { isActive: false },
      },
    });

    return Result.ok(inactivada);
  }
}
