/**
 * CrearAlertaAdminUseCase.ts
 *
 * Caso de uso para emitir una alerta administrativa u operativa (RF-ADM-C13).
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { AlertaAdmin, PrioridadAlerta } from '../../domain/entities/AlertaAdmin.ts';
import { IAlertaAdminRepository } from '../../domain/repositories/IAlertaAdminRepository.ts';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface CrearAlertaAdminRequest {
  sucursalId: number;
  motivo: string;
  prioridad?: PrioridadAlerta;
  descripcion?: string | null;
  actor: ActorAuditoria;
}

export type CrearAlertaAdminResponse = Result<AlertaAdmin, DomainError>;

export class CrearAlertaAdminUseCase {
  constructor(
    private readonly sucursalRepository: ISucursalRepository,
    private readonly alertaAdminRepository: IAlertaAdminRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearAlertaAdminRequest): Promise<CrearAlertaAdminResponse> {
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }

    if (!sucursal.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    const alerta = await this.alertaAdminRepository.crear({
      usuarioId: request.actor.usuarioId,
      sucursalId: request.sucursalId,
      motivo: request.motivo,
      prioridad: request.prioridad ?? 'normal',
      descripcion: request.descripcion ?? null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.ALERTAS_ADMIN,
      entidadId: alerta.id,
      detalles: {
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        motivo: alerta.motivo,
        prioridad: alerta.prioridad,
        estado: alerta.estado,
      },
    });

    return Result.ok(alerta);
  }
}
