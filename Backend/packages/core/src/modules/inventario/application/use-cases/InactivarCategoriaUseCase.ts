import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';
import {
  CategoriaConProductosActivosError,
  CategoriaNoEncontradaError,
} from '../../domain/errors/InventarioErrors.ts';

export interface InactivarCategoriaRequest {
  id: number;
  actor: ActorAuditoria;
}

export type InactivarCategoriaResponse = Result<Categoria, DomainError>;

/**
 * Caso de uso: InactivarCategoriaUseCase (RF-ADM-B5, RF-ADM-B19)
 *
 * Restricción RF-ADM-B19:
 * Impide la inactivación de una categoría que tenga productos activos vinculados,
 * solicitando reasignar o inactivar previamente dichos productos.
 */
export class InactivarCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditor: IAuditor,
    private readonly productoRepository?: IProductoRepository,
  ) {}

  public async execute(request: InactivarCategoriaRequest): Promise<InactivarCategoriaResponse> {
    const existente = await this.categoriaRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new CategoriaNoEncontradaError());
    }

    // RF-ADM-B19: Si la categoría está activa, validar que no tenga productos activos asociados
    if (existente.isActive && this.productoRepository) {
      const productosActivos = await this.productoRepository.contarActivosPorCategoria(request.id);
      if (productosActivos > 0) {
        return Result.fail(new CategoriaConProductosActivosError(productosActivos));
      }
    }

    const inactivada = await this.categoriaRepository.cambiarEstado(request.id, false);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.INACTIVAR,
      entidad: ENTIDADES_AUDITORIA.CATEGORIAS,
      entidadId: String(request.id),
      detalles: {
        antes: { isActive: existente.isActive },
        despues: { isActive: false },
      },
    });

    return Result.ok(inactivada);
  }
}
