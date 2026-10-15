import { DomainError, Result } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { ISucursalRepository } from '../../../administracion/domain/repositories/ISucursalRepository.ts';
import {
  DatosRegistroEntrada,
  IMovimientoInventarioRepository,
  MovimientoInventario,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  CantidadInvalidaError,
  ProductoInactivoError,
  ProductoNoEncontradoError,
  ProveedorInactivoError,
  ProveedorNoEncontradoError,
} from '../../domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';

export interface RegistrarEntradaRequest {
  productoId: string;
  sucursalId: number;
  cantidad: number;
  proveedorId?: number | null;
  motivo?: string | null;
  actor: ActorAuditoria;
}

export type RegistrarEntradaResponse = Result<MovimientoInventario, DomainError>;

/**
 * RF-ADM-B7: Registro de entradas de mercancía
 * RNF-ADM-02: Auditoría inmutable con IAuditor
 * RNF-ADM-04: Validación de alcance de sucursal con ResolverAlcanceSucursalUseCase
 */
export class RegistrarEntradaInventarioUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly productoRepository: IProductoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: RegistrarEntradaRequest): Promise<RegistrarEntradaResponse> {
    // 1. Validar cantidad entera positiva
    if (!Number.isInteger(request.cantidad) || request.cantidad <= 0) {
      return Result.fail(new CantidadInvalidaError());
    }

    // 2. Validar alcance de la sucursal del actor (RNF-ADM-04)
    if (this.resolverAlcance) {
      const alcance = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
      if (alcance.isFailure) {
        return Result.fail(alcance.error);
      }
      if (!alcance.value.permite(request.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    }

    // 3. Validar que el producto exista y esté activo en catálogo
    const producto = await this.productoRepository.findById(request.productoId);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }
    if (!producto.isActive) {
      return Result.fail(new ProductoInactivoError());
    }

    // 4. Validar que la sucursal exista y esté activa
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }
    if (!sucursal.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    // 4. Validar proveedor si fue suministrado
    if (request.proveedorId !== undefined && request.proveedorId !== null) {
      const proveedor = await this.proveedorRepository.findById(request.proveedorId);
      if (!proveedor) {
        return Result.fail(new ProveedorNoEncontradoError());
      }
      if (!proveedor.isActive) {
        return Result.fail(new ProveedorInactivoError());
      }
    }

    // 5. Consultar stock previo para auditoría diferencial
    const stockAnterior = await this.movimientoRepository.obtenerStockActual(
      request.productoId,
      request.sucursalId,
    );

    // 6. Registrar entrada atómica en persistencia
    const movimiento = await this.movimientoRepository.registrarEntrada({
      productoId: request.productoId,
      sucursalId: request.sucursalId,
      cantidad: request.cantidad,
      proveedorId: request.proveedorId ?? null,
      motivo: request.motivo?.trim() || null,
      usuarioId: request.actor.usuarioId,
    });

    const stockNuevo = stockAnterior + request.cantidad;

    // 7. Auditar mutación (RNF-ADM-02)
    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: request.productoId,
      detalles: {
        antes: { stockActual: stockAnterior },
        despues: { stockActual: stockNuevo },
        tipoMovimiento: 'entrada',
        sucursalId: request.sucursalId,
        cantidad: request.cantidad,
        proveedorId: request.proveedorId ?? null,
        motivo: request.motivo?.trim() || null,
        movimientoId: movimiento.id,
      },
    });

    return Result.ok(movimiento);
  }
}
