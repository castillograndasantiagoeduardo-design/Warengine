import { DomainError, Result } from '@warengine/shared-kernel';
import {
  IMovimientoInventarioRepository,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import {
  EntradaNoEncontradaError,
  EntradaYaAnuladaError,
  MotivoAnulacionRequeridoError,
  StockInsuficienteError,
} from '../../domain/errors/InventarioErrors.ts';
import { AnulacionEntradaResponse } from '@warengine/contracts';

export interface AnularEntradaRequest {
  id: string;
  motivo: string;
  actor: ActorAuditoria;
}

export type AnularEntradaResponse = Result<AnulacionEntradaResponse, DomainError>;

/**
 * Caso de uso: AnularEntradaInventarioUseCase (RF-ADM-B16)
 *
 * Permite anular una entrada de mercancía registrada por error o devolución al proveedor:
 * 1. Exige un motivo obligatorio de anulación.
 * 2. Bloquea si la entrada ya fue anulada previamente (idempotencia).
 * 3. Bloquea si el stock actual es inferior a la cantidad a revertir (stock no negativo).
 * 4. Valida alcance de sucursal (RNF-ADM-04).
 * 5. Registra el movimiento compensatorio inmutable y audita la acción.
 */
export class AnularEntradaInventarioUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly auditor: IAuditor,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: AnularEntradaRequest): Promise<AnularEntradaResponse> {
    // 1. Validar motivo obligatorio
    const motivoLimpio = request.motivo?.trim();
    if (!motivoLimpio || motivoLimpio.length < 5) {
      return Result.fail(new MotivoAnulacionRequeridoError());
    }

    // 2. Consultar la entrada original
    const entrada = await this.movimientoRepository.obtenerPorId(request.id);
    if (!entrada || entrada.tipo !== 'entrada') {
      return Result.fail(new EntradaNoEncontradaError());
    }

    // 3. Validar alcance de sucursal (RNF-ADM-04)
    if (this.resolverAlcance) {
      const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
      if (alcanceResult.isFailure) {
        return Result.fail(alcanceResult.error);
      }

      const alcance = alcanceResult.value;
      if (!alcance.permite(entrada.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    }

    // 4. Verificar si ya fue anulada previamente
    const yaAnulada = await this.movimientoRepository.estaEntradaAnulada(request.id);
    if (yaAnulada) {
      return Result.fail(new EntradaYaAnuladaError());
    }

    // 5. Verificar stock actual vs cantidad a revertir
    const stockActual = await this.movimientoRepository.obtenerStockActual(
      entrada.productoId,
      entrada.sucursalId,
    );
    if (stockActual < entrada.cantidad) {
      return Result.fail(
        new StockInsuficienteError(
          `No se puede anular la entrada: el stock actual (${stockActual}) es menor a la cantidad a revertir (${entrada.cantidad}).`,
        ),
      );
    }

    // 6. Ejecutar anulación transaccional en persistencia
    let compensatorio;
    try {
      compensatorio = await this.movimientoRepository.anularEntrada(request.id, {
        motivo: motivoLimpio,
        usuarioId: request.actor.usuarioId,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }

    const stockResultante = compensatorio.stockResultante ?? (stockActual - entrada.cantidad);

    // 7. Auditar anulación
    await this.auditor.registrar({
      actor: request.actor,
      accion: 'anular',
      entidad: 'movimientos_inventario',
      entidadId: request.id,
      detalles: {
        motivo: motivoLimpio,
        entradaOriginalId: request.id,
        movimientoCompensatorioId: compensatorio.id,
        productoId: entrada.productoId,
        sucursalId: entrada.sucursalId,
        cantidadRevertida: entrada.cantidad,
        stockAnterior: stockActual,
        stockResultante,
      },
    });

    return Result.ok({
      mensaje: `Entrada ${request.id} anulada exitosamente. Se revirtieron ${entrada.cantidad} unidades.`,
      movimientoCompensatorioId: compensatorio.id,
      entradaOriginalId: request.id,
      productoId: entrada.productoId,
      sucursalId: entrada.sucursalId,
      cantidadRevertida: entrada.cantidad,
      stockResultante,
    });
  }
}
