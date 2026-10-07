import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';
import { ProveedorNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';

export interface EditarProveedorRequest {
  id: number;
  nombre?: string;
  contacto?: string | null;
  isActive?: boolean;
  usuarioId?: string | null;
  ip?: string | null;
}

export type EditarProveedorResponse = Result<Proveedor, DomainError>;

export class EditarProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: EditarProveedorRequest): Promise<EditarProveedorResponse> {
    const existente = await this.proveedorRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProveedorNoEncontradoError());
    }

    const { id, usuarioId, ip, ...cambios } = request;
    const actualizado = await this.proveedorRepository.actualizar(id, cambios);

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'EDITAR',
      entidad: 'proveedores',
      entidadId: String(id),
      detalles: { cambios },
      ip,
    });

    return Result.ok(actualizado);
  }
}
