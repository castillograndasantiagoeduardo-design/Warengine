import { DomainError, Result } from '@warengine/shared-kernel';
import { TurnoCaja } from '../../domain/entities/TurnoCaja.ts';
import {
    FondoFinalInvalidoError,
    NoEsDuenioDelTurnoError,
    TurnoNoEncontradoError,
    TurnoYaCerradoError,
} from '../../domain/errors/TurnoCajaErrors.ts';
import { ITurnoCajaRepository } from '../../domain/repositories/ITurnoCajaRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface CerrarTurnoCajaRequest {
    turnoId: string;
    fondoFinal: number;
    actor: ActorAuditoria;
}

export type CerrarTurnoCajaResponse = Result<TurnoCaja, DomainError>;

export class CerrarTurnoCajaUseCase {
    constructor(
        private readonly turnoRepository: ITurnoCajaRepository,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(request: CerrarTurnoCajaRequest): Promise<CerrarTurnoCajaResponse> {
        if (!Number.isFinite(request.fondoFinal) || request.fondoFinal < 0) {
            return Result.fail(new FondoFinalInvalidoError());
        }
        const fondoFinal = Math.round(request.fondoFinal * 100) / 100;

        const turno = await this.turnoRepository.findById(request.turnoId);
        if (!turno) {
            return Result.fail(new TurnoNoEncontradoError());
        }

        if (!turno.estaAbierto) {
            return Result.fail(new TurnoYaCerradoError());
        }

        // Solo el operador que abrió el turno puede cerrarlo
        if (turno.usuarioId !== request.actor.usuarioId) {
            return Result.fail(new NoEsDuenioDelTurnoError());
        }

        const turnoCerrado = await this.turnoRepository.cerrar(request.turnoId, fondoFinal);

        await this.auditor.registrar({
            actor: request.actor,
            accion: ACCIONES_AUDITORIA.EDITAR,
            entidad: ENTIDADES_AUDITORIA.TURNOS_CAJA,
            entidadId: turnoCerrado.id,
            detalles: {
                antes: {
                    fechaCierre: null,
                    fondoFinal: null,
                    diferencia: null,
                },
                despues: {
                    fechaCierre: turnoCerrado.fechaCierre,
                    fondoFinal: turnoCerrado.fondoFinal,
                    diferencia: turnoCerrado.diferencia,
                },
            },
        });

        return Result.ok(turnoCerrado);
    }
}
