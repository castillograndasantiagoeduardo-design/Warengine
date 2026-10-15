import { DomainError, Result } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ISucursalRepository } from '../../../administracion/domain/repositories/ISucursalRepository.ts';
import {
  IInventarioSucursalRepository,
} from '../../domain/repositories/IInventarioSucursalRepository.ts';
import { InventarioSucursal } from '../../domain/entities/InventarioSucursal.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  ProductoInactivoError,
  ProductoNoEncontradoError,
  StockMinimoInvalidoError,
} from '../../domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';

export interface ConfigurarStockMinimoRequest {
  productoId: string;
  sucursalId: number;
  stockMinimo: number;
  actor: ActorAuditoria;
}

export type ConfigurarStockMinimoResponse = Result<InventarioSucursal, DomainError>;

/**
 * Caso de uso: Configuración de stock mínimo por producto y sucursal (RF-ADM-B11)
 *
 * Reglas de negocio:
 * 1. El stock mínimo debe ser un entero mayor o igual a cero.
 * 2. El producto debe existir y estar activo en el catálogo maestro.
 * 3. La sucursal debe existir y estar activa en el sistema.
 * 4. RNF-ADM-04: El usuario solo puede configurar stock en sucursales autorizadas para su perfil.
 * 5. RNF-ADM-02: Se registra log de auditoría inmutable con el valor previo y el nuevo valor.
 */
export class ConfigurarStockMinimoUseCase {
  constructor(
    private readonly inventarioSucursalRepository: IInventarioSucursalRepository,
    private readonly productoRepository: IProductoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly auditor: IAuditor,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(
    request: ConfigurarStockMinimoRequest,
  ): Promise<ConfigurarStockMinimoResponse> {
    // 1. Validar que stockMinimo sea entero no negativo
    if (!Number.isInteger(request.stockMinimo) || request.stockMinimo < 0) {
      return Result.fail(new StockMinimoInvalidoError());
    }

    // 2. RNF-ADM-04: Validar alcance de sucursal para el actor
    if (this.resolverAlcance) {
      const alcance = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
      if (alcance.isFailure) {
        return Result.fail(alcance.error);
      }
      if (!alcance.value.permite(request.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    }

    // 3. Validar existencia y estado activo del producto
    const producto = await this.productoRepository.findById(request.productoId);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }
    if (!producto.isActive) {
      return Result.fail(new ProductoInactivoError());
    }

    // 4. Validar existencia y estado activo de la sucursal
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }
    if (!sucursal.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    // 5. Consultar valor previo para trazabilidad en auditoría
    const previo = await this.inventarioSucursalRepository.obtener(
      request.productoId,
      request.sucursalId,
    );

    // 6. Persistir el nuevo umbral de stock mínimo
    const resultado = await this.inventarioSucursalRepository.establecerStockMinimo(
      request.productoId,
      request.sucursalId,
      request.stockMinimo,
    );

    // 7. RNF-ADM-02: Registrar evento en la auditoría inmutable
    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: request.productoId,
      detalles: {
        sucursalId: request.sucursalId,
        sucursalNombre: sucursal.nombre,
        productoNombre: producto.nombre,
        sku: producto.sku,
        antes: previo ? { stockMinimo: previo.stockMinimo } : null,
        despues: { stockMinimo: resultado.stockMinimo },
      },
    });

    return Result.ok(resultado);
  }
}
