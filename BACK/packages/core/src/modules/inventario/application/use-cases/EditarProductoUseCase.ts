import { Result, DomainError } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { Producto } from '../../domain/entities/Producto.ts';
import {
  CategoriaInactivaError,
  CategoriaNoEncontradaError,
  ProductoNoEncontradoError,
  ProveedorInactivoError,
  ProveedorNoEncontradoError,
  SkuDuplicadoError,
  SkuModificacionNoPermitidaError,
} from '../../domain/errors/InventarioErrors.ts';

export interface EditarProductoRequest {
  id: string;
  sku?: string;
  nombre?: string;
  categoriaId?: number | null;
  proveedorId?: number | null;
  precioCompra?: number;
  precioVenta?: number;
  precioCorporativo?: number | null;
  isActive?: boolean;
  actor: ActorAuditoria;
}

export type EditarProductoResponse = Result<Producto, DomainError>;

export class EditarProductoUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarProductoRequest): Promise<EditarProductoResponse> {
    const existente = await this.productoRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    const { id, actor, ...cambios } = request;

    // 1. Si intenta cambiar SKU
    if (cambios.sku !== undefined && cambios.sku !== existente.sku) {
      const tieneMovimientos = await this.productoRepository.tieneMovimientos(id);
      if (tieneMovimientos) {
        return Result.fail(new SkuModificacionNoPermitidaError());
      }

      const conMismoSku = await this.productoRepository.findBySku(cambios.sku);
      if (conMismoSku && conMismoSku.id !== id) {
        return Result.fail(new SkuDuplicadoError(cambios.sku));
      }
    }

    // 2. Si cambia categoría
    if (cambios.categoriaId !== undefined && cambios.categoriaId !== null) {
      const categoria = await this.categoriaRepository.findById(cambios.categoriaId);
      if (!categoria) {
        return Result.fail(new CategoriaNoEncontradaError());
      }
      if (!categoria.isActive) {
        return Result.fail(new CategoriaInactivaError());
      }
    }

    // 3. Si cambia proveedor
    if (cambios.proveedorId !== undefined && cambios.proveedorId !== null) {
      const proveedor = await this.proveedorRepository.findById(cambios.proveedorId);
      if (!proveedor) {
        return Result.fail(new ProveedorNoEncontradoError());
      }
      if (!proveedor.isActive) {
        return Result.fail(new ProveedorInactivoError());
      }
    }

    // 4. Actualizar en repositorio
    let actualizada: Producto;
    try {
      actualizada = await this.productoRepository.actualizar(id, cambios);
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }

    // 5. Construir detalles de auditoría con antes y después solo de lo modificado
    const claves = (Object.keys(cambios) as Array<keyof typeof cambios>).filter(
      (clave) => cambios[clave] !== undefined && (existente as any)[clave] !== (actualizada as any)[clave],
    );

    const antes: Record<string, unknown> = {};
    const despues: Record<string, unknown> = {};
    for (const clave of claves) {
      antes[clave] = (existente as any)[clave];
      despues[clave] = (actualizada as any)[clave];
    }

    const detalles: Record<string, unknown> = { antes, despues };

    // Historial de precios identificado explícitamente en los detalles de auditoría
    const cambioPrecio: Record<string, { antes: number | null; despues: number | null }> = {};
    if ('precioVenta' in despues) {
      cambioPrecio.precioVenta = {
        antes: existente.precioVenta,
        despues: actualizada.precioVenta,
      };
    }
    if ('precioCorporativo' in despues) {
      cambioPrecio.precioCorporativo = {
        antes: existente.precioCorporativo,
        despues: actualizada.precioCorporativo,
      };
    }
    if (Object.keys(cambioPrecio).length > 0) {
      detalles.cambioPrecio = cambioPrecio;
    }

    await this.auditor.registrar({
      actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: id,
      detalles,
    });

    return Result.ok(actualizada);
  }
}
