import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';
import { ProveedorNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';

export interface InactivarProveedorRequest {
  id: number;
  usuarioId?: string | null;
  ip?: string | null;
}

export type InactivarProveedorResponse = Result<Proveedor, DomainError>;

export class InactivarProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: InactivarProveedorRequest): Promise<InactivarProveedorResponse> {
    const existente = await this.proveedorRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProveedorNoEncontradoError());
    }

    const inactivado = await this.proveedorRepository.cambiarEstado(request.id, false);

    await this.auditoriaService.registrar({
      usuarioId: request.usuarioId,
      accion: 'INACTIVAR',
      entidad: 'proveedores',
      entidadId: String(request.id),
      detalles: { isActive: false },
      ip: request.ip,
    });

    return Result.ok(inactivado);
  }
}
