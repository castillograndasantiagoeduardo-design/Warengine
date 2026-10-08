import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';

export interface CrearCategoriaRequest {
  nombre: string;
  actor: ActorAuditoria;
}

export type CrearCategoriaResponse = Result<Categoria, DomainError>;

export class CrearCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearCategoriaRequest): Promise<CrearCategoriaResponse> {
    const categoria = await this.categoriaRepository.crear({
      nombre: request.nombre,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS,
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
