import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { TurnoNoEncontradoError } from '../../domain/errors/TurnoCajaErrors.ts';
import { ITurnoCajaRepository } from '../../domain/repositories/ITurnoCajaRepository.ts';
import type { TurnoCorteDetalleDto } from '@warengine/contracts';

export interface ObtenerCorteTurnoRequest {
    turnoId: string;
    usuarioId: string;
}

export type ObtenerCorteTurnoResponse = Result<TurnoCorteDetalleDto, DomainError>;

export class ObtenerCorteTurnoUseCase {
    constructor(
        private readonly turnoRepository: ITurnoCajaRepository,
        private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    ) { }

    public async execute(request: ObtenerCorteTurnoRequest): Promise<ObtenerCorteTurnoResponse> {
        if (!this.turnoRepository.obtenerCorte) {
            throw new Error('Método obtenerCorte no implementado');
        }
        const corte = await this.turnoRepository.obtenerCorte(request.turnoId);
        if (!corte) {
            return Result.fail(new TurnoNoEncontradoError());
        }

        const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
        if (alcance.isFailure) return Result.fail(alcance.error);

        if (!alcance.value.permite(corte.sucursalId)) {
            return Result.fail(new SucursalFueraDeAlcanceError());
        }

        return Result.ok(corte);
    }
}
