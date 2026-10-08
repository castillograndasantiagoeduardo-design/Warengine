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

export interface ReactivarProductoRequest {
  id: string;
  actor: ActorAuditoria;
}

export type ReactivarProductoResponse = Result<Producto, DomainError>;

export class ReactivarProductoUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: ReactivarProductoRequest): Promise<ReactivarProductoResponse> {
    const existente = await this.productoRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    const reactivado = await this.productoRepository.cambiarEstado(request.id, true);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.ACTIVAR,
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: request.id,
      detalles: {
        antes: { isActive: existente.isActive },
        despues: { isActive: true },
      },
    });

    return Result.ok(reactivado);
  }
}
