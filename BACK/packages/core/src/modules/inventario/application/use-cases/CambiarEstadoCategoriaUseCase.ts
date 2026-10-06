import { Result, DomainError } from '@warengine/shared-kernel';
import { InactivarCategoriaUseCase } from './InactivarCategoriaUseCase.ts';
import { ReactivarCategoriaUseCase } from './ReactivarCategoriaUseCase.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';

export interface CambiarEstadoCategoriaRequest {
  id: number;
  isActive: boolean;
  usuarioId?: string | null;
  ip?: string | null;
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
        usuarioId: request.usuarioId,
        ip: request.ip,
      });
    } else {
      return await this.inactivarCategoriaUseCase.execute({
        id: request.id,
        usuarioId: request.usuarioId,
        ip: request.ip,
      });
    }
  }
}
