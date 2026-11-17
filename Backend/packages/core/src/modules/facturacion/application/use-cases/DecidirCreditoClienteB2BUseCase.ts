import { DomainError, Result } from '@warengine/shared-kernel';
import type { PlazoCreditoDias } from '@warengine/contracts';
import { Cliente } from '../../domain/entities/Cliente.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import {
  ClienteNoEncontradoError,
  DecisionCreditoInvalidaError,
} from '../../domain/errors/FacturacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface DecidirCreditoClienteB2BRequest {
  clienteId: string;
  decision: 'aprobar' | 'rechazar';
  cupoAprobado?: number;
  plazoCreditoDias?: PlazoCreditoDias;
  motivo?: string;
  actor: ActorAuditoria;
}

export type DecidirCreditoClienteB2BResponse = Result<Cliente, DomainError>;

/**
 * Caso de uso exclusivo del Super Admin para autorizar (y liberar) o rechazar
 * el cupo de crédito corporativo de un cliente B2B.
 */
export class DecidirCreditoClienteB2BUseCase {
  constructor(
    private readonly clienteRepository: IClienteRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: DecidirCreditoClienteB2BRequest,
  ): Promise<DecidirCreditoClienteB2BResponse> {
    const cliente = await this.clienteRepository.findById(request.clienteId);
    if (!cliente) {
      return Result.fail(new ClienteNoEncontradoError());
    }
    if (!cliente.esB2B) {
      return Result.fail(
        new DecisionCreditoInvalidaError('Solo los clientes corporativos (B2B) pueden tener cupo de crédito.'),
      );
    }

    const aprobar = request.decision === 'aprobar';
    const cupoSolicitado = aprobar
      ? (request.cupoAprobado ?? cliente.cupoCreditoSugerido)
      : 0;

    if (aprobar && (!cupoSolicitado || cupoSolicitado <= 0)) {
      return Result.fail(
        new DecisionCreditoInvalidaError('Para aprobar el crédito debes definir un cupo mayor a 0.'),
      );
    }

    if (request.decision === 'rechazar' && (!request.motivo || request.motivo.trim().length < 5)) {
      return Result.fail(
        new DecisionCreditoInvalidaError('Para rechazar el crédito debes indicar un motivo (mínimo 5 caracteres).'),
      );
    }

    if (!this.clienteRepository.decidirCredito) {
      return Result.fail(
        new DecisionCreditoInvalidaError('El repositorio actual no soporta gestión de cupos de crédito.'),
      );
    }

    const ahora = new Date();
    const cupoFinal = aprobar ? Math.round(cupoSolicitado * 100) / 100 : 0;

    const actualizado = await this.clienteRepository.decidirCredito(cliente.id, {
      creditoHabilitado: aprobar,
      estadoCredito: aprobar ? 'aprobado' : 'rechazado',
      cupoCreditoAprobado: cupoFinal,
      plazoCreditoDias: request.plazoCreditoDias ?? cliente.plazoCreditoDias ?? 30,
      creditoAprobadoPor: request.actor.usuarioId,
      creditoAprobadoEn: ahora,
      motivoDecisionCredito: request.motivo?.trim() || null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.CLIENTES,
      entidadId: actualizado.id,
      detalles: {
        antes: {
          creditoHabilitado: cliente.creditoHabilitado,
          estadoCredito: cliente.estadoCredito,
          cupoCreditoAprobado: cliente.cupoCreditoAprobado,
        },
        despues: {
          creditoHabilitado: actualizado.creditoHabilitado,
          estadoCredito: actualizado.estadoCredito,
          cupoCreditoAprobado: actualizado.cupoCreditoAprobado,
          plazoCreditoDias: actualizado.plazoCreditoDias,
          motivoDecisionCredito: actualizado.motivoDecisionCredito,
        },
      },
    });

    return Result.ok(actualizado);
  }
}
