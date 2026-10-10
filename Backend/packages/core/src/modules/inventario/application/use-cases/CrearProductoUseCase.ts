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
  ProveedorInactivoError,
  ProveedorNoEncontradoError,
  SkuDuplicadoError,
} from '../../domain/errors/InventarioErrors.ts';

export interface CrearProductoRequest {
  sku: string;
  nombre: string;
  categoriaId?: number | null;
  proveedorId?: number | null;
  precioCompra: number;
  precioVenta: number;
  precioCorporativo?: number | null;
  stockInicial?: number;
  stockMinimo?: number;
  sucursalId?: number;
  actor: ActorAuditoria;
}

export type CrearProductoResponse = Result<Producto, DomainError>;

export class CrearProductoUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearProductoRequest): Promise<CrearProductoResponse> {
    // 1. Validar categoría si se suministró
    if (request.categoriaId !== undefined && request.categoriaId !== null) {
      const categoria = await this.categoriaRepository.findById(request.categoriaId);
      if (!categoria) {
        return Result.fail(new CategoriaNoEncontradaError());
      }
      if (!categoria.isActive) {
        return Result.fail(new CategoriaInactivaError());
      }
    }

    // 2. Validar proveedor si se suministró
    if (request.proveedorId !== undefined && request.proveedorId !== null) {
      const proveedor = await this.proveedorRepository.findById(request.proveedorId);
      if (!proveedor) {
        return Result.fail(new ProveedorNoEncontradoError());
      }
      if (!proveedor.isActive) {
        return Result.fail(new ProveedorInactivoError());
      }
    }

    // 3. Validar unicidad del SKU
    const existenteSku = await this.productoRepository.findBySku(request.sku);
    if (existenteSku) {
      return Result.fail(new SkuDuplicadoError(request.sku));
    }

    // 4. Crear producto
    let producto: Producto;
    try {
      producto = await this.productoRepository.crear({
        sku: request.sku,
        nombre: request.nombre,
        categoriaId: request.categoriaId ?? null,
        proveedorId: request.proveedorId ?? null,
        precioCompra: request.precioCompra,
        precioVenta: request.precioVenta,
        precioCorporativo: request.precioCorporativo ?? null,
        stockInicial: request.stockInicial,
        stockMinimo: request.stockMinimo,
        sucursalId: request.sucursalId,
        usuarioId: request.actor.usuarioId,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }

    // 5. Auditar creación (convención: solo despues)
    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: producto.id,
      detalles: {
        despues: {
          sku: producto.sku,
          nombre: producto.nombre,
          categoriaId: producto.categoriaId,
          proveedorId: producto.proveedorId,
          precioCompra: producto.precioCompra,
          precioVenta: producto.precioVenta,
          precioCorporativo: producto.precioCorporativo,
          isActive: producto.isActive,
        },
      },
    });

    return Result.ok(producto);
  }
}
