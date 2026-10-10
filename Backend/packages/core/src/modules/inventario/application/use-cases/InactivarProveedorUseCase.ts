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

export interface InactivarProveedorRequest {
  id: number;
  actor: ActorAuditoria;
}

export type InactivarProveedorResponse = Result<Proveedor, DomainError>;

export class InactivarProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: InactivarProveedorRequest): Promise<InactivarProveedorResponse> {
    const existente = await this.proveedorRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProveedorNoEncontradoError());
    }

    const inactivado = await this.proveedorRepository.cambiarEstado(request.id, false);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.INACTIVAR,
      entidad: ENTIDADES_AUDITORIA.PROVEEDORES,
      entidadId: String(request.id),
      detalles: {
        antes: { isActive: existente.isActive },
        despues: { isActive: false },
      },
    });

    return Result.ok(inactivado);
  }
}
