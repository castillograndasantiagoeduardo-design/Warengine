import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';

export interface CrearProveedorRequest {
  nombre: string;
  contacto?: string | null;
  actor: ActorAuditoria;
}

export type CrearProveedorResponse = Result<Proveedor, DomainError>;

export class CrearProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearProveedorRequest): Promise<CrearProveedorResponse> {
    const proveedor = await this.proveedorRepository.crear({
      nombre: request.nombre,
      contacto: request.contacto ?? null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.PROVEEDORES,
      entidadId: String(proveedor.id),
      detalles: {
        despues: {
          nombre: proveedor.nombre,
          contacto: proveedor.contacto,
          isActive: proveedor.isActive,
        },
      },
    });

    return Result.ok(proveedor);
  }
}
