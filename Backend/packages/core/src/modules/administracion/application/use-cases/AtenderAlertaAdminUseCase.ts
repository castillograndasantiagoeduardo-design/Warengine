/**
 * AtenderAlertaAdminUseCase.ts
 *
 * Caso de uso para marcar una alerta como 'visto' o 'atendido' (RF-ADM-C13).
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { AlertaAdmin, EstadoAlerta } from '../../domain/entities/AlertaAdmin.ts';
import { IAlertaAdminRepository } from '../../domain/repositories/IAlertaAdminRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { AlertaAdminNoEncontradaError } from '../../domain/errors/AdministracionErrors.ts';

export interface AtenderAlertaAdminRequest {
  id: string;
  estado: 'visto' | 'atendido';
  actor: ActorAuditoria;
}

export type AtenderAlertaAdminResponse = Result<AlertaAdmin, DomainError>;

export class AtenderAlertaAdminUseCase {
  constructor(
    private readonly alertaAdminRepository: IAlertaAdminRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: AtenderAlertaAdminRequest): Promise<AtenderAlertaAdminResponse> {
    const actual = await this.alertaAdminRepository.findById(request.id);
    if (!actual) {
      return Result.fail(new AlertaAdminNoEncontradaError());
    }

    const fechaAtencion = request.estado === 'atendido' ? new Date() : actual.fechaAtencion;

    const actualizada = await this.alertaAdminRepository.actualizarEstado(
      request.id,
      request.estado as EstadoAlerta,
      fechaAtencion,
    );

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.ALERTAS_ADMIN,
      entidadId: request.id,
      detalles: {
        antes: { estado: actual.estado, fechaAtencion: actual.fechaAtencion },
        despues: { estado: actualizada.estado, fechaAtencion: actualizada.fechaAtencion },
      },
    });

    return Result.ok(actualizada);
  }
}
