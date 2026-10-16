import { Result, DomainError } from '@warengine/shared-kernel';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Proveedor } from '../../domain/entities/Proveedor.ts';
import {
  ProveedorConProductosActivosError,
  ProveedorNoEncontradoError,
} from '../../domain/errors/InventarioErrors.ts';

export interface InactivarProveedorRequest {
  id: number;
  actor: ActorAuditoria;
}

export type InactivarProveedorResponse = Result<Proveedor, DomainError>;

/**
 * Caso de uso: InactivarProveedorUseCase (RF-ADM-B6, RF-ADM-B19)
 *
 * Restricción RF-ADM-B19:
 * Impide la inactivación de un proveedor que tenga productos activos vinculados,
 * solicitando reasignar o inactivar previamente dichos productos.
 */
export class InactivarProveedorUseCase {
  constructor(
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
    private readonly productoRepository?: IProductoRepository,
  ) {}

  public async execute(request: InactivarProveedorRequest): Promise<InactivarProveedorResponse> {
    const existente = await this.proveedorRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProveedorNoEncontradoError());
    }

    // RF-ADM-B19: Si el proveedor está activo, validar que no tenga productos activos asociados
    if (existente.isActive && this.productoRepository) {
      const productosActivos = await this.productoRepository.contarActivosPorProveedor(request.id);
      if (productosActivos > 0) {
        return Result.fail(new ProveedorConProductosActivosError(productosActivos));
      }
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
