import { Result, DomainError } from '@warengine/shared-kernel';
import { CategoriaActivo } from '../../domain/entities/CategoriaActivo.ts';
import { ICategoriaActivoRepository } from '../../domain/repositories/ICategoriaActivoRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  CategoriaActivoNoEncontradaError,
  CategoriaActivoDuplicadaError,
} from '../../domain/errors/LogisticaErrors.ts';

export interface EditarCategoriaActivoRequest {
  id: number;
  nombre: string;
  actor: ActorAuditoria;
}

export type EditarCategoriaActivoResponse = Result<CategoriaActivo, DomainError>;

export class EditarCategoriaActivoUseCase {
  constructor(
    private readonly categoriaActivoRepository: ICategoriaActivoRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarCategoriaActivoRequest): Promise<EditarCategoriaActivoResponse> {
    const categoria = await this.categoriaActivoRepository.findById(request.id);
    if (!categoria) {
      return Result.fail(new CategoriaActivoNoEncontradaError());
    }

    const nuevoNombre = request.nombre.trim();
    if (categoria.nombre.toLowerCase() === nuevoNombre.toLowerCase()) {
      return Result.ok(categoria);
    }

    const existente = await this.categoriaActivoRepository.findByNombre(nuevoNombre);
    if (existente && existente.id !== categoria.id) {
      return Result.fail(new CategoriaActivoDuplicadaError(nuevoNombre));
    }

    const actualizada = await this.categoriaActivoRepository.actualizar(categoria.id, {
      nombre: nuevoNombre,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS_ACTIVOS,
      entidadId: String(categoria.id),
      detalles: {
        antes: { nombre: categoria.nombre },
        despues: { nombre: actualizada.nombre },
      },
    });

    return Result.ok(actualizada);
  }
}
