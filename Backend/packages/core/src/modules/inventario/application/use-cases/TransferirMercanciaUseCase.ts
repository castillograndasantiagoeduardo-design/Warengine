import { DomainError, Result } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ISucursalRepository } from '../../../administracion/domain/repositories/ISucursalRepository.ts';
import {
  IMovimientoInventarioRepository,
  ResultadoTransferenciaMercancia,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  CantidadInvalidaError,
  ProductoInactivoError,
  ProductoNoEncontradoError,
  StockInsuficienteError,
  SucursalesTransferenciaIgualesError,
} from '../../domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { TransferirMercanciaResponse } from '@warengine/contracts';

export interface TransferirMercanciaRequest {
  productoId: string;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  cantidad: number;
  motivo?: string | null;
  actor: ActorAuditoria;
}

export type TransferirMercanciaResult = Result<TransferirMercanciaResponse, DomainError>;

/**
 * Caso de uso: TransferirMercanciaUseCase (RF-ADM-B18)
 *
 * Permite la transferencia de stock entre dos sucursales:
 * 1. Valida que las sucursales de origen y destino sean distintas.
 * 2. Valida que la cantidad sea un entero positivo (> 0).
 * 3. Valida aislamiento de sede (RNF-ADM-04) sobre la sucursal de origen.
 * 4. Valida que el producto exista y esté activo.
 * 5. Valida que ambas sucursales (origen y destino) existan y estén activas.
 * 6. Valida que la sucursal de origen tenga stock suficiente.
 * 7. Ejecuta la transferencia atómica en el repositorio (descuenta origen, suma destino, registra movimientos inmutables de salida y entrada).
 * 8. Registra evento de auditoría inmutable (RNF-ADM-02).
 */
export class TransferirMercanciaUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly productoRepository: IProductoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly auditor: IAuditor,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: TransferirMercanciaRequest): Promise<TransferirMercanciaResult> {
    // 1. Validar que las sucursales de origen y destino sean distintas
    if (request.sucursalOrigenId === request.sucursalDestinoId) {
      return Result.fail(new SucursalesTransferenciaIgualesError());
    }

    // 2. Validar cantidad entera positiva
    if (
      typeof request.cantidad !== 'number' ||
      !Number.isInteger(request.cantidad) ||
      request.cantidad <= 0
    ) {
      return Result.fail(new CantidadInvalidaError());
    }

    // 3. Validar alcance de sede (RNF-ADM-04) sobre la sucursal de origen
    if (this.resolverAlcance) {
      const alcanceResult = await this.resolverAlcance.execute({
        usuarioId: request.actor.usuarioId,
      });
      if (alcanceResult.isFailure) {
        return Result.fail(alcanceResult.error);
      }

      const alcance = alcanceResult.value;
      if (!alcance.permite(request.sucursalOrigenId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    }

    // 4. Validar existencia y estado activo del producto
    const producto = await this.productoRepository.findById(request.productoId);
    if (!producto) {
      return Result.fail(new ProductoNoEncontradoError());
    }
    if (!producto.isActive) {
      return Result.fail(new ProductoInactivoError());
    }

    // 5. Validar existencia y estado activo de sucursal origen
    const sucursalOrigen = await this.sucursalRepository.findById(request.sucursalOrigenId);
    if (!sucursalOrigen) {
      return Result.fail(new SucursalNoEncontradaError());
    }
    if (!sucursalOrigen.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    // 6. Validar existencia y estado activo de sucursal destino
    const sucursalDestino = await this.sucursalRepository.findById(request.sucursalDestinoId);
    if (!sucursalDestino) {
      return Result.fail(new SucursalNoEncontradaError());
    }
    if (!sucursalDestino.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    // 7. Validar stock suficiente en sucursal de origen
    const stockOrigen = await this.movimientoRepository.obtenerStockActual(
      request.productoId,
      request.sucursalOrigenId,
    );
    if (stockOrigen < request.cantidad) {
      return Result.fail(
        new StockInsuficienteError(
          `Stock insuficiente en sucursal origen (${stockOrigen}) para transferir (${request.cantidad}).`,
        ),
      );
    }

    // 8. Ejecutar transferencia atómica
    const motivoLimpio = request.motivo?.trim() || null;
    let resultado: ResultadoTransferenciaMercancia;

    try {
      resultado = await this.movimientoRepository.transferirMercancia({
        productoId: request.productoId,
        sucursalOrigenId: request.sucursalOrigenId,
        sucursalDestinoId: request.sucursalDestinoId,
        cantidad: request.cantidad,
        motivo: motivoLimpio,
        usuarioId: request.actor.usuarioId,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }

    // 9. Registrar evento de auditoría inmutable (RNF-ADM-02)
    await this.auditor.registrar({
      actor: request.actor,
      accion: 'transferir_mercancia',
      entidad: 'inventario_sucursal',
      entidadId: `${request.sucursalOrigenId}->${request.sucursalDestinoId}:${request.productoId}`,
      detalles: {
        productoId: request.productoId,
        sucursalOrigenId: request.sucursalOrigenId,
        sucursalDestinoId: request.sucursalDestinoId,
        cantidad: request.cantidad,
        stockRestanteOrigen: resultado.stockRestanteOrigen,
        stockResultanteDestino: resultado.stockResultanteDestino,
        movimientoSalidaId: resultado.movimientoSalidaId,
        movimientoEntradaId: resultado.movimientoEntradaId,
        motivo: motivoLimpio,
      },
    });

    // 10. Responder
    return Result.ok({
      mensaje: `Transferencia de ${request.cantidad} unidades completada exitosamente.`,
      productoId: resultado.productoId,
      sucursalOrigenId: resultado.sucursalOrigenId,
      sucursalDestinoId: resultado.sucursalDestinoId,
      cantidad: resultado.cantidad,
      movimientoSalidaId: resultado.movimientoSalidaId,
      movimientoEntradaId: resultado.movimientoEntradaId,
      stockRestanteOrigen: resultado.stockRestanteOrigen,
      stockResultanteDestino: resultado.stockResultanteDestino,
      fecha: resultado.fecha,
    });
  }
}
