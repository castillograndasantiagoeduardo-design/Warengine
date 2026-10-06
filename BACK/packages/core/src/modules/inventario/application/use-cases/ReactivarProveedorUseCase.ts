import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';
import { ProveedorNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';

export interface ReactivarProveedorRequest {
  id: number;
  usuarioId?: string | null;
  ip?: string | null;
}

export type ReactivarProveedorResponse = Result<Proveedor, DomainError>;

export class ReactivarProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: ReactivarProveedorRequest): Promise<ReactivarProveedorResponse> {
    const existente = await this.proveedorRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProveedorNoEncontradoError());
    }

    const reactivado = await this.proveedorRepository.cambiarEstado(request.id, true);

    await this.auditoriaService.registrar({
      usuarioId: request.usuarioId,
      accion: 'REACTIVAR',
      entidad: 'proveedores',
      entidadId: String(request.id),
      detalles: { isActive: true },
      ip: request.ip,
    });

    return Result.ok(reactivado);
  }
}
