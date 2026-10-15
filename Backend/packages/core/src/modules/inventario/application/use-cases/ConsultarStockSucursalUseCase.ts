import { DomainError, Result } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ISucursalRepository } from '../../../administracion/domain/repositories/ISucursalRepository.ts';
import {
  DatosDetalleStockSucursal,
  IInventarioSucursalRepository,
} from '../../domain/repositories/IInventarioSucursalRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { ProductoNoEncontradoError } from '../../domain/errors/InventarioErrors.ts';
import { SucursalNoEncontradaError } from '../../../administracion/domain/errors/AdministracionErrors.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';

export interface ConsultarStockSucursalRequest {
  productoId: string;
  sucursalId: number;
  actor: ActorAuditoria;
}

export type ConsultarStockSucursalResponse = Result<DatosDetalleStockSucursal, DomainError>;

/**
 * Caso de uso: Consultar existencias y umbral de stock mínimo de un producto en una sucursal (RF-ADM-B11).
 */
export class ConsultarStockSucursalUseCase {
  constructor(
    private readonly inventarioSucursalRepository: IInventarioSucursalRepository,
    private readonly productoRepository: IProductoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(
    request: ConsultarStockSucursalRequest,
  ): Promise<ConsultarStockSucursalResponse> {
    // 1. RNF-ADM-04: Validar alcance de sede del actor
    if (this.resolverAlcance) {
      const alcance = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
      if (alcance.isFailure) {
        return Result.fail(alcance.error);
      }
      if (!alcance.value.permite(request.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    }

    // 2. Validar existencia del producto
    const producto = await this.productoRepository.findById(request.productoId);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    // 3. Validar existencia de la sucursal
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }

    // 4. Obtener detalle desde el repositorio
    const detalle = await this.inventarioSucursalRepository.obtenerDetalle(
      request.productoId,
      request.sucursalId,
    );

    if (detalle) {
      return Result.ok(detalle);
    }

    // Si aún no tiene fila en inventario_sucursal, retornar valores iniciales en cero
    return Result.ok({
      productoId: producto.id,
      nombreProducto: producto.nombre,
      sku: producto.sku,
      sucursalId: sucursal.id,
      nombreSucursal: sucursal.nombre,
      stockActual: 0,
      stockMinimo: 0,
      alertaAbastecimiento: true, // 0 <= 0 dispara alerta
    });
  }
}
