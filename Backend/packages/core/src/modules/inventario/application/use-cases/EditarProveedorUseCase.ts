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

export interface EditarProveedorRequest {
  id: number;
  nombre?: string;
  contacto?: string | null;
  isActive?: boolean;
  actor: ActorAuditoria;
}

export type EditarProveedorResponse = Result<Proveedor, DomainError>;

export class EditarProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarProveedorRequest): Promise<EditarProveedorResponse> {
    const existente = await this.proveedorRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProveedorNoEncontradoError());
    }

    const { id, actor, ...cambios } = request;
    const actualizado = await this.proveedorRepository.actualizar(id, cambios);

    const claves = (Object.keys(cambios) as Array<keyof typeof cambios>).filter(
      (clave) => cambios[clave] !== undefined,
    );
    const antes: Record<string, unknown> = {};
    const despues: Record<string, unknown> = {};
    for (const clave of claves) {
      antes[clave] = existente[clave];
      despues[clave] = actualizado[clave];
    }

    await this.auditor.registrar({
      actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.PROVEEDORES,
      entidadId: String(id),
      detalles: { antes, despues },
    });

    return Result.ok(actualizado);
  }
}
