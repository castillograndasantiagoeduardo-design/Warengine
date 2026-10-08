import { DomainError, Result } from '@warengine/shared-kernel';
import { TurnoCaja } from '../../domain/entities/TurnoCaja.ts';
import {
    FondoInicialInvalidoError,
    OperadorSinSucursalError,
    TurnoYaAbiertoError,
} from '../../domain/errors/TurnoCajaErrors.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { ITurnoCajaRepository } from '../../domain/repositories/ITurnoCajaRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface AbrirTurnoCajaRequest {
    fondoInicial: number;
    actor: ActorAuditoria;
}

export type AbrirTurnoCajaResponse = Result<TurnoCaja, DomainError>;

export class AbrirTurnoCajaUseCase {
    constructor(
        private readonly turnoRepository: ITurnoCajaRepository,
        private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(request: AbrirTurnoCajaRequest): Promise<AbrirTurnoCajaResponse> {
        // RF-FMC-A4: el fondo inicial es obligatorio y no puede ser negativo.
        if (!Number.isFinite(request.fondoInicial) || request.fondoInicial < 0) {
            return Result.fail(new FondoInicialInvalidoError());
        }
        const fondoInicial = Math.round(request.fondoInicial * 100) / 100;

        const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(
            request.actor.usuarioId,
        );
        if (sucursalId === null) {
            return Result.fail(new OperadorSinSucursalError());
        }

        // Un solo turno abierto por usuario (pendiente 6.9: lo valida el caso de uso).
        const abierto = await this.turnoRepository.buscarAbiertoDeUsuario(request.actor.usuarioId);
        if (abierto) {
            return Result.fail(new TurnoYaAbiertoError());
        }

        // RF-FMC-A5: el fondo declarado queda registrado como base del cierre.
        const turno = await this.turnoRepository.abrir({
            usuarioId: request.actor.usuarioId,
            sucursalId,
            fondoInicial,
        });
        if (!turno) {
            // Otra petición abrió un turno entre la consulta y el insert.
            return Result.fail(new TurnoYaAbiertoError());
        }

        await this.auditor.registrar({
            actor: request.actor,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES_AUDITORIA.TURNOS_CAJA,
            entidadId: turno.id,
            detalles: { despues: { sucursalId: turno.sucursalId, fondoInicial: turno.fondoInicial } },
        });

        return Result.ok(turno);
    }
}