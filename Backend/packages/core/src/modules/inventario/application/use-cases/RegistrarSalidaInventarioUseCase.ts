import { DomainError, Result } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ISucursalRepository } from '../../../administracion/domain/repositories/ISucursalRepository.ts';
import {
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
  MotivoSalidaRequeridoError,
  ProductoNoEncontradoError,
  StockInsuficienteError,
} from '../../domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';

export interface RegistrarSalidaRequest {
  productoId: string;
  sucursalId: number;
  cantidad: number;
  motivo: string;
  actor: ActorAuditoria;
}

export type RegistrarSalidaResponse = Result<MovimientoInventario, DomainError>;

export class RegistrarSalidaInventarioUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly productoRepository: IProductoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: RegistrarSalidaRequest): Promise<RegistrarSalidaResponse> {
    // 1. Validar cantidad entera positiva
    if (!Number.isInteger(request.cantidad) || request.cantidad <= 0) {
      return Result.fail(new CantidadInvalidaError());
    }

    // 2. Validar justificación obligatoria (RF-ADM-B8)
    if (!request.motivo || request.motivo.trim().length < 3) {
      return Result.fail(new MotivoSalidaRequeridoError());
    }

    // 3. Validar producto
    const producto = await this.productoRepository.findById(request.productoId);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    // 4. Validar sucursal
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }
    if (!sucursal.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    // 5. Validar stock no negativo (RF-ADM-B9)
    const stockDisponible = await this.movimientoRepository.obtenerStockActual(
      request.productoId,
      request.sucursalId,
    );

    if (stockDisponible < request.cantidad) {
      return Result.fail(new StockInsuficienteError(stockDisponible, request.cantidad));
    }

    // 6. Registrar salida atómica en persistencia
    const movimiento = await this.movimientoRepository.registrarSalida({
      productoId: request.productoId,
      sucursalId: request.sucursalId,
      cantidad: request.cantidad,
      motivo: request.motivo.trim(),
      usuarioId: request.actor.usuarioId,
    });

    const stockNuevo = stockDisponible - request.cantidad;

    // 7. Auditar mutación (RNF-ADM-02)
    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.PRODUCTOS,
      entidadId: request.productoId,
      detalles: {
        antes: { stockActual: stockDisponible },
        despues: { stockActual: stockNuevo },
        tipoMovimiento: 'salida',
        sucursalId: request.sucursalId,
        cantidad: request.cantidad,
        motivo: request.motivo.trim(),
        movimientoId: movimiento.id,
      },
    });

    return Result.ok(movimiento);
  }
}
