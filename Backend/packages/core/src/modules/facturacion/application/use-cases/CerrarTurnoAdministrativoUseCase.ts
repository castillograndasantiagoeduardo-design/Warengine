import { DomainError, Result } from '@warengine/shared-kernel';
import { TurnoCaja } from '../../domain/entities/TurnoCaja.ts';
import {
    FondoFinalInvalidoError,
    MotivoCierreAdministrativoInvalidoError,
    TurnoNoEncontradoError,
    TurnoYaCerradoError,
} from '../../domain/errors/TurnoCajaErrors.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ITurnoCajaRepository } from '../../domain/repositories/ITurnoCajaRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface CerrarTurnoAdministrativoRequest {
    turnoId: string;
    motivo: string;
    fondoFinal?: number;
    actor: ActorAuditoria;
}

export type CerrarTurnoAdministrativoResponse = Result<TurnoCaja, DomainError>;

export class CerrarTurnoAdministrativoUseCase {
    constructor(
        private readonly turnoRepository: ITurnoCajaRepository,
        private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(request: CerrarTurnoAdministrativoRequest): Promise<CerrarTurnoAdministrativoResponse> {
        const motivo = request.motivo?.trim();
        if (!motivo || motivo.length < 5) {
            return Result.fail(new MotivoCierreAdministrativoInvalidoError());
        }

        let fondoFinal: number | undefined;
        if (request.fondoFinal !== undefined && request.fondoFinal !== null) {
            if (!Number.isFinite(request.fondoFinal) || request.fondoFinal < 0) {
                return Result.fail(new FondoFinalInvalidoError());
            }
            fondoFinal = Math.round(request.fondoFinal * 100) / 100;
        }

        const turno = await this.turnoRepository.findById(request.turnoId);
        if (!turno) {
            return Result.fail(new TurnoNoEncontradoError());
        }

        if (!turno.estaAbierto) {
            return Result.fail(new TurnoYaCerradoError());
        }

        // Validar alcance de sucursal
        const alcance = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
        if (alcance.isFailure) {
            return Result.fail(alcance.error);
        }

        if (!alcance.value.permite(turno.sucursalId)) {
            return Result.fail(new SucursalFueraDeAlcanceError());
        }

        if (!this.turnoRepository.cerrarAdministrativo) {
            throw new Error('Método cerrarAdministrativo no implementado');
        }

        let turnoCerrado: TurnoCaja;
        try {
            turnoCerrado = await this.turnoRepository.cerrarAdministrativo({
                turnoId: request.turnoId,
                motivo,
                fondoFinal,
                cerradoPor: request.actor.usuarioId,
            });
        } catch (err) {
            if (err instanceof TurnoYaCerradoError) {
                return Result.fail(err);
            }
            throw err;
        }

        await this.auditor.registrar({
            actor: request.actor,
            accion: ACCIONES_AUDITORIA.EDITAR,
            entidad: ENTIDADES_AUDITORIA.TURNOS_CAJA,
            entidadId: turnoCerrado.id,
            detalles: {
                tipoCierre: 'administrativo',
                motivo,
                cerradoPor: request.actor.usuarioId,
                antes: {
                    fechaCierre: null,
                    fondoFinal: null,
                    diferencia: null,
                    tipoCierre: turno.tipoCierre,
                },
                despues: {
                    fechaCierre: turnoCerrado.fechaCierre,
                    fondoFinal: turnoCerrado.fondoFinal,
                    diferencia: turnoCerrado.diferencia,
                    tipoCierre: turnoCerrado.tipoCierre,
                    cerradoPor: turnoCerrado.cerradoPor,
                    motivoCierre: turnoCerrado.motivoCierre,
                },
            },
        });

        return Result.ok(turnoCerrado);
    }
}
