import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';
import { ProveedorNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';

export interface ReactivarProveedorRequest {
  id: number;
  actor: ActorAuditoria;
}

export type ReactivarProveedorResponse = Result<Proveedor, DomainError>;

export class ReactivarProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: ReactivarProveedorRequest): Promise<ReactivarProveedorResponse> {
    const existente = await this.proveedorRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProveedorNoEncontradoError());
    }

    const reactivado = await this.proveedorRepository.cambiarEstado(request.id, true);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.ACTIVAR,
      entidad: ENTIDADES_AUDITORIA.PROVEEDORES,
      entidadId: String(request.id),
      detalles: {
        antes: { isActive: existente.isActive },
        despues: { isActive: true },
      },
    });

    return Result.ok(reactivado);
  }
}
