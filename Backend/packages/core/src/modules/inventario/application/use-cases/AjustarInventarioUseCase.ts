import { DomainError, Result } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ISucursalRepository } from '../../../administracion/domain/repositories/ISucursalRepository.ts';
import {
  IMovimientoInventarioRepository,
  MovimientoInventario,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  MotivoAjusteRequeridoError,
  ProductoInactivoError,
  ProductoNoEncontradoError,
  StockFisicoInvalidoError,
  StockInsuficienteError,
} from '../../domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { AjusteInventarioResponse } from '@warengine/contracts';

export interface AjustarInventarioRequest {
  productoId: string;
  sucursalId: number;
  stockFisico: number;
  motivo: string;
  actor: ActorAuditoria;
}

export type AjustarInventarioResult = Result<AjusteInventarioResponse, DomainError>;

/**
 * Caso de uso: AjustarInventarioUseCase (RF-ADM-B17)
 *
 * Permite realizar un ajuste de inventario basado en conteo físico real:
 * 1. Exige justificación/motivo obligatorio (mínimo 5 caracteres).
 * 2. Valida que el stock físico sea un entero no negativo (>= 0).
 * 3. Valida aislamiento de sede (RNF-ADM-04) mediante ResolverAlcanceSucursalUseCase.
 * 4. Valida que el producto y la sucursal existan y estén activos.
 * 5. Si stockFisico > stockActual: registra movimiento inmutable 'ajuste_entrada'.
 * 6. Si stockFisico < stockActual: registra movimiento inmutable 'ajuste_salida' (con validación de no negatividad).
 * 7. Si stockFisico == stockActual: no altera existencias ni genera movimientos innecesarios.
 * 8. Registra evento de auditoría inmutable (RNF-ADM-02).
 */
export class AjustarInventarioUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly productoRepository: IProductoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly auditor: IAuditor,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: AjustarInventarioRequest): Promise<AjustarInventarioResult> {
    // 1. Validar motivo obligatorio (mínimo 5 caracteres)
    const motivoLimpio = request.motivo?.trim();
    if (!motivoLimpio || motivoLimpio.length < 5) {
      return Result.fail(new MotivoAjusteRequeridoError());
    }

    // 2. Validar stock físico entero >= 0
    if (
      typeof request.stockFisico !== 'number' ||
      !Number.isInteger(request.stockFisico) ||
      request.stockFisico < 0
    ) {
      return Result.fail(new StockFisicoInvalidoError());
    }

    // 3. Validar alcance de sucursal (RNF-ADM-04)
    if (this.resolverAlcance) {
      const alcanceResult = await this.resolverAlcance.execute({
        usuarioId: request.actor.usuarioId,
      });
      if (alcanceResult.isFailure) {
        return Result.fail(alcanceResult.error);
      }

      const alcance = alcanceResult.value;
      if (!alcance.permite(request.sucursalId)) {
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

    // 5. Validar existencia y estado activo de la sucursal
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }
    if (!sucursal.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    // 6. Consultar stock actual en la sucursal
    const stockPrevio = await this.movimientoRepository.obtenerStockActual(
      request.productoId,
      request.sucursalId,
    );

    const diferencia = request.stockFisico - stockPrevio;

    // Caso A: Sin diferencia (stock físico coincide con stock del sistema)
    if (diferencia === 0) {
      await this.auditor.registrar({
        actor: request.actor,
        accion: 'ajustar_stock',
        entidad: 'inventario_sucursal',
        entidadId: `${request.sucursalId}-${request.productoId}`,
        detalles: {
          productoId: request.productoId,
          sucursalId: request.sucursalId,
          stockPrevio,
          stockFisico: request.stockFisico,
          diferencia: 0,
          tipoAjuste: 'sin_cambio',
          motivo: motivoLimpio,
        },
      });

      return Result.ok({
        mensaje: 'El stock físico coincide con el stock del sistema. No se requirió movimiento de ajuste.',
        ajusteRealizado: false,
        movimientoId: null,
        productoId: request.productoId,
        sucursalId: request.sucursalId,
        stockPrevio,
        stockFisico: request.stockFisico,
        diferencia: 0,
        tipoAjuste: 'sin_cambio',
      });
    }

    // Caso B: Stock físico superior -> ajuste_entrada
    if (diferencia > 0) {
      let mov: MovimientoInventario;
      try {
        mov = await this.movimientoRepository.registrarAjuste({
          productoId: request.productoId,
          sucursalId: request.sucursalId,
          tipo: 'ajuste_entrada',
          cantidad: diferencia,
          motivo: motivoLimpio,
          usuarioId: request.actor.usuarioId,
        });
      } catch (error) {
        if (error instanceof DomainError) {
          return Result.fail(error);
        }
        throw error;
      }

      await this.auditor.registrar({
        actor: request.actor,
        accion: 'ajustar_stock',
        entidad: 'inventario_sucursal',
        entidadId: `${request.sucursalId}-${request.productoId}`,
        detalles: {
          movimientoId: mov.id,
          productoId: request.productoId,
          sucursalId: request.sucursalId,
          tipoAjuste: 'ajuste_entrada',
          cantidadAjustada: diferencia,
          stockPrevio,
          stockFisico: request.stockFisico,
          diferencia,
          motivo: motivoLimpio,
        },
      });

      return Result.ok({
        mensaje: `Ajuste de entrada registrado exitosamente (+${diferencia} unidades).`,
        ajusteRealizado: true,
        movimientoId: mov.id,
        productoId: request.productoId,
        sucursalId: request.sucursalId,
        stockPrevio,
        stockFisico: request.stockFisico,
        diferencia,
        tipoAjuste: 'ajuste_entrada',
      });
    }

    // Caso C: Stock físico inferior -> ajuste_salida
    const cantidadSalida = Math.abs(diferencia);
    let mov: MovimientoInventario;
    try {
      mov = await this.movimientoRepository.registrarAjuste({
        productoId: request.productoId,
        sucursalId: request.sucursalId,
        tipo: 'ajuste_salida',
        cantidad: cantidadSalida,
        motivo: motivoLimpio,
        usuarioId: request.actor.usuarioId,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }

    await this.auditor.registrar({
      actor: request.actor,
      accion: 'ajustar_stock',
      entidad: 'inventario_sucursal',
      entidadId: `${request.sucursalId}-${request.productoId}`,
      detalles: {
        movimientoId: mov.id,
        productoId: request.productoId,
        sucursalId: request.sucursalId,
        tipoAjuste: 'ajuste_salida',
        cantidadAjustada: cantidadSalida,
        stockPrevio,
        stockFisico: request.stockFisico,
        diferencia,
        motivo: motivoLimpio,
      },
    });

    return Result.ok({
      mensaje: `Ajuste de salida registrado exitosamente (-${cantidadSalida} unidades).`,
      ajusteRealizado: true,
      movimientoId: mov.id,
      productoId: request.productoId,
      sucursalId: request.sucursalId,
      stockPrevio,
      stockFisico: request.stockFisico,
      diferencia,
      tipoAjuste: 'ajuste_salida',
    });
  }
}
