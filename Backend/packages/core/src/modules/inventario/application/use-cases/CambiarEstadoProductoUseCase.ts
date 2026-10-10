import { Result, DomainError } from '@warengine/shared-kernel';
import { InactivarProductoUseCase } from './InactivarProductoUseCase.ts';
import { ReactivarProductoUseCase } from './ReactivarProductoUseCase.ts';
import { Producto } from '../../domain/entities/Producto.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface CambiarEstadoProductoRequest {
  id: string;
  isActive: boolean;
  actor: ActorAuditoria;
}

export type CambiarEstadoProductoResponse = Result<Producto, DomainError>;

export class CambiarEstadoProductoUseCase {
  constructor(
    private readonly inactivarProductoUseCase: InactivarProductoUseCase,
    private readonly reactivarProductoUseCase: ReactivarProductoUseCase,
  ) {}

  public async execute(request: CambiarEstadoProductoRequest): Promise<CambiarEstadoProductoResponse> {
    if (request.isActive) {
      return await this.reactivarProductoUseCase.execute({
        id: request.id,
        actor: request.actor,
      });
    } else {
      return await this.inactivarProductoUseCase.execute({
        id: request.id,
        actor: request.actor,
      });
    }
  }
}
