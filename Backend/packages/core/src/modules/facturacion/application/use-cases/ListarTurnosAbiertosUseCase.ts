import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import {
    IConsultaTurnosAbiertosRepository,
    TurnoAbiertoResumen,
} from '../../domain/repositories/IConsultaTurnosAbiertosRepository.ts';

export interface ListarTurnosAbiertosRequest {
    usuarioId: string;
    sucursalId?: number;
}

export type ListarTurnosAbiertosResponse = Result<TurnoAbiertoResumen[], DomainError>;

/**
 * Cajeros en turno de una sede (tablero del Admin de Sucursal).
 * RNF-ADM-04: el alcance se resuelve en el servidor; un usuario limitado solo ve sus sedes.
 * Solo lectura: no audita.
 */
export class ListarTurnosAbiertosUseCase {
    constructor(
        private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
        private readonly consultaTurnos: IConsultaTurnosAbiertosRepository,
    ) { }

    public async execute(request: ListarTurnosAbiertosRequest): Promise<ListarTurnosAbiertosResponse> {
        const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
        if (alcance.isFailure) return Result.fail(alcance.error);

        let sucursalIds: number[] | undefined;
        if (request.sucursalId !== undefined) {
            if (!alcance.value.permite(request.sucursalId)) {
                return Result.fail(new SucursalFueraDeAlcanceError());
            }
            sucursalIds = [request.sucursalId];
        } else {
            sucursalIds = alcance.value.sucursalesPermitidas();
            if (sucursalIds && sucursalIds.length === 0) return Result.ok([]);
        }

        return Result.ok(await this.consultaTurnos.listarAbiertos(sucursalIds));
    }
}
