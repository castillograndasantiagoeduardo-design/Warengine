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
  CategoriaActivoDuplicadaError,
} from '../../domain/errors/LogisticaErrors.ts';

export interface CrearCategoriaActivoRequest {
  nombre: string;
  actor: ActorAuditoria;
}

export type CrearCategoriaActivoResponse = Result<CategoriaActivo, DomainError>;

export class CrearCategoriaActivoUseCase {
  constructor(
    private readonly categoriaActivoRepository: ICategoriaActivoRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearCategoriaActivoRequest): Promise<CrearCategoriaActivoResponse> {
    const nombreLimpio = request.nombre.trim();
    const existente = await this.categoriaActivoRepository.findByNombre(nombreLimpio);
    if (existente) {
      return Result.fail(new CategoriaActivoDuplicadaError(nombreLimpio));
    }

    const categoria = await this.categoriaActivoRepository.crear({ nombre: nombreLimpio });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS_ACTIVOS,
      entidadId: String(categoria.id),
      detalles: {
        despues: {
          nombre: categoria.nombre,
          isActive: categoria.isActive,
        },
      },
    });

    return Result.ok(categoria);
  }
}
