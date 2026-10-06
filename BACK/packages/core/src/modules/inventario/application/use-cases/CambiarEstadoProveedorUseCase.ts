import { Result, DomainError } from '@warengine/shared-kernel';
import { InactivarProveedorUseCase } from './InactivarProveedorUseCase.ts';
import { ReactivarProveedorUseCase } from './ReactivarProveedorUseCase.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';

export interface CambiarEstadoProveedorRequest {
  id: number;
  isActive: boolean;
  usuarioId?: string | null;
  ip?: string | null;
}

export type CambiarEstadoProveedorResponse = Result<Proveedor, DomainError>;

export class CambiarEstadoProveedorUseCase {
  constructor(
    private readonly inactivarProveedorUseCase: InactivarProveedorUseCase,
    private readonly reactivarProveedorUseCase: ReactivarProveedorUseCase,
  ) {}

  public async execute(request: CambiarEstadoProveedorRequest): Promise<CambiarEstadoProveedorResponse> {
    if (request.isActive) {
      return await this.reactivarProveedorUseCase.execute({
        id: request.id,
        usuarioId: request.usuarioId,
        ip: request.ip,
      });
    } else {
      return await this.inactivarProveedorUseCase.execute({
        id: request.id,
        usuarioId: request.usuarioId,
        ip: request.ip,
      });
    }
  }
}
