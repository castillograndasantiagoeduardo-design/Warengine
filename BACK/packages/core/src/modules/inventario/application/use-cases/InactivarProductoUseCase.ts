import { Result, DomainError } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Producto } from '../../domain/entities/Producto.ts';
import { ProductoNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';

export interface InactivarProductoRequest {
  id: string;
  actor: ActorAuditoria;
}

export type InactivarProductoResponse = Result<Producto, DomainError>;

export class InactivarProductoUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: InactivarProductoRequest): Promise<InactivarProductoResponse> {
    const existente = await this.productoRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    const inactivado = await this.productoRepository.cambiarEstado(request.id, false);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.INACTIVAR,
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: request.id,
      detalles: {
        antes: { isActive: existente.isActive },
        despues: { isActive: false },
      },
    });

    return Result.ok(inactivado);
  }
}
