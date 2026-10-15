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
  ProductoNoEncontradoError,
  ProveedorInactivoError,
  ProveedorNoEncontradoError,
} from '../../domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';

export interface RegistrarEntradaRequest {
  productoId: string;
  sucursalId: number;
  cantidad: number;
  proveedorId?: number | null;
  motivo?: string | null;
  actor: ActorAuditoria;
}

export type RegistrarEntradaResponse = Result<MovimientoInventario, DomainError>;

export class RegistrarEntradaInventarioUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly productoRepository: IProductoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: RegistrarEntradaRequest): Promise<RegistrarEntradaResponse> {
    // 1. Validar cantidad entera positiva
    if (!Number.isInteger(request.cantidad) || request.cantidad <= 0) {
      return Result.fail(new CantidadInvalidaError());
    }

    // 2. Validar que el producto exista
    const producto = await this.productoRepository.findById(request.productoId);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    // 3. Validar que la sucursal exista y esté activa
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
