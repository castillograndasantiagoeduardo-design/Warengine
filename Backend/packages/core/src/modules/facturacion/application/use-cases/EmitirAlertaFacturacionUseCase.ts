import { DomainError, Result } from '@warengine/shared-kernel';
import { AlertaAdmin, PrioridadAlerta } from '../../../administracion/domain/entities/AlertaAdmin.ts';
import { IAlertaAdminRepository } from '../../../administracion/domain/repositories/IAlertaAdminRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { OperadorSinSucursalError } from '../../domain/errors/TurnoCajaErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface EmitirAlertaFacturacionRequest {
    motivo: string;
    prioridad?: PrioridadAlerta;
    descripcion?: string | null;
    actor: ActorAuditoria;
}

export type EmitirAlertaFacturacionResponse = Result<AlertaAdmin, DomainError>;

export class EmitirAlertaFacturacionUseCase {
    constructor(
        private readonly alertaAdminRepository: IAlertaAdminRepository,
        private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(request: EmitirAlertaFacturacionRequest): Promise<EmitirAlertaFacturacionResponse> {
        const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(request.actor.usuarioId);
        if (sucursalId === null) {
            return Result.fail(new OperadorSinSucursalError());
        }

        const alerta = await this.alertaAdminRepository.crear({
            usuarioId: request.actor.usuarioId,
            sucursalId,
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
                despues: {
                    motivo: alerta.motivo,
                    prioridad: alerta.prioridad,
                    sucursalId,
                },
            },
        });

        return Result.ok(alerta);
    }
}
