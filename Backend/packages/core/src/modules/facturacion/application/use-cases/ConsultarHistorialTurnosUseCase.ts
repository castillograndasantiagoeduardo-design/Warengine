import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import {
    ITurnoCajaRepository,
    ResultadoHistorialTurnos,
} from '../../domain/repositories/ITurnoCajaRepository.ts';
import type { HistorialTurnosQuery } from '@warengine/contracts';

export type ConsultarHistorialTurnosRequest = Partial<HistorialTurnosQuery> & {
    usuarioIdPeticion: string;
};

export type ConsultarHistorialTurnosResponse = Result<ResultadoHistorialTurnos, DomainError>;

export class ConsultarHistorialTurnosUseCase {
    constructor(
        private readonly turnoRepository: ITurnoCajaRepository,
        private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    ) { }

    public async execute(request: ConsultarHistorialTurnosRequest): Promise<ConsultarHistorialTurnosResponse> {
        const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioIdPeticion });
        if (alcance.isFailure) return Result.fail(alcance.error);

        let sucursalIds: number[] | undefined;
        if (request.sucursalId !== undefined) {
            if (!alcance.value.permite(request.sucursalId)) {
                return Result.fail(new SucursalFueraDeAlcanceError());
            }
            sucursalIds = [request.sucursalId];
        } else {
            sucursalIds = alcance.value.sucursalesPermitidas();
            if (sucursalIds && sucursalIds.length === 0) {
                return Result.ok({
                    items: [],
                    total: 0,
                    totalPaginas: 0,
                    page: request.page ?? 1,
                    limite: request.limite ?? 20,
                });
            }
        }

        if (!this.turnoRepository.listarHistorial) {
            throw new Error('Método listarHistorial no implementado');
        }

        const resultado = await this.turnoRepository.listarHistorial({
            ...request,
            sucursalIds,
        });

        return Result.ok(resultado);
    }
}
