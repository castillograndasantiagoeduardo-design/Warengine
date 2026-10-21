import { Result, DomainError } from '@warengine/shared-kernel';
import { CategoriaActivo } from '../../domain/entities/CategoriaActivo.ts';
import { ICategoriaActivoRepository } from '../../domain/repositories/ICategoriaActivoRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { CategoriaActivoNoEncontradaError } from '../../domain/errors/LogisticaErrors.ts';

export interface CambiarEstadoCategoriaActivoRequest {
  id: number;
  isActive: boolean;
  actor: ActorAuditoria;
}

export type CambiarEstadoCategoriaActivoResponse = Result<CategoriaActivo, DomainError>;

export class CambiarEstadoCategoriaActivoUseCase {
  constructor(
    private readonly categoriaActivoRepository: ICategoriaActivoRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CambiarEstadoCategoriaActivoRequest): Promise<CambiarEstadoCategoriaActivoResponse> {
    const categoria = await this.categoriaActivoRepository.findById(request.id);
    if (!categoria) {
      return Result.fail(new CategoriaActivoNoEncontradaError());
    }

    if (categoria.isActive === request.isActive) {
      return Result.ok(categoria);
    }

    const actualizada = await this.categoriaActivoRepository.cambiarEstado(
      categoria.id,
      request.isActive,
    );

    await this.auditor.registrar({
      actor: request.actor,
      accion: request.isActive ? ACCIONES_AUDITORIA.ACTIVAR : ACCIONES_AUDITORIA.INACTIVAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS_ACTIVOS,
      entidadId: String(categoria.id),
      detalles: {
        antes: { isActive: categoria.isActive },
        despues: { isActive: actualizada.isActive },
      },
    });

    return Result.ok(actualizada);
  }
}
