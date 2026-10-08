import { DomainError, Result } from '@warengine/shared-kernel';
import { TurnoCaja } from '../../domain/entities/TurnoCaja.ts';
import { ITurnoCajaRepository } from '../../domain/repositories/ITurnoCajaRepository.ts';

export interface ObtenerTurnoActualRequest {
    usuarioId: string;
}

export type ObtenerTurnoActualResponse = Result<{ turno: TurnoCaja | null }, DomainError>;

export class ObtenerTurnoActualUseCase {
    constructor(private readonly turnoRepository: ITurnoCajaRepository) { }

    /** El front lo llama tras el login: si `turno` es null, debe pedir el fondo inicial (RF-FMC-A4). */
    public async execute(request: ObtenerTurnoActualRequest): Promise<ObtenerTurnoActualResponse> {
        const turno = await this.turnoRepository.buscarAbiertoDeUsuario(request.usuarioId);
        return Result.ok({ turno });
    }
}