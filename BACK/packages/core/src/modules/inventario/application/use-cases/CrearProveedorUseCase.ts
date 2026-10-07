import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';

export interface CrearProveedorRequest {
  nombre: string;
  contacto?: string | null;
  usuarioId?: string | null;
  ip?: string | null;
}

export type CrearProveedorResponse = Result<Proveedor, DomainError>;

export class CrearProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: CrearProveedorRequest): Promise<CrearProveedorResponse> {
    const proveedor = await this.proveedorRepository.crear({
      nombre: request.nombre,
      contacto: request.contacto ?? null,
    });

    await this.auditoriaService.registrar({
      usuarioId: request.usuarioId,
      accion: 'CREAR',
      entidad: 'proveedores',
      entidadId: String(proveedor.id),
      detalles: { nombre: proveedor.nombre, contacto: proveedor.contacto },
      ip: request.ip,
    });

    return Result.ok(proveedor);
  }
}
