import { Result, DomainError } from '@warengine/shared-kernel';
import { InactivarCategoriaUseCase } from './InactivarCategoriaUseCase.ts';
import { ReactivarCategoriaUseCase } from './ReactivarCategoriaUseCase.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface CambiarEstadoCategoriaRequest {
  id: number;
  isActive: boolean;
  actor: ActorAuditoria;
}

export type CambiarEstadoCategoriaResponse = Result<Categoria, DomainError>;

export class CambiarEstadoCategoriaUseCase {
  constructor(
    private readonly inactivarCategoriaUseCase: InactivarCategoriaUseCase,
    private readonly reactivarCategoriaUseCase: ReactivarCategoriaUseCase,
  ) {}

  public async execute(request: CambiarEstadoCategoriaRequest): Promise<CambiarEstadoCategoriaResponse> {
    if (request.isActive) {
      return await this.reactivarCategoriaUseCase.execute({
        id: request.id,
        actor: request.actor,
      });
    } else {
      return await this.inactivarCategoriaUseCase.execute({
        id: request.id,
        actor: request.actor,
      });
    }
  }
}
