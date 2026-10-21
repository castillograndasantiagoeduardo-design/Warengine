import { Result, DomainError } from '@warengine/shared-kernel';
import { AsignacionActivo } from '../../domain/entities/AsignacionActivo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IAsignacionActivoRepository } from '../../domain/repositories/IAsignacionActivoRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ActivoNoEncontradoError } from '../../domain/errors/LogisticaErrors.ts';

export interface ConsultarHistorialAsignacionesRequest {
  activoId: string;
  usuarioId: string;
}

export type ConsultarHistorialAsignacionesResponse = Result<AsignacionActivo[], DomainError>;

export class ConsultarHistorialAsignacionesUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly asignacionRepository: IAsignacionActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ConsultarHistorialAsignacionesRequest): Promise<ConsultarHistorialAsignacionesResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    const historial = await this.asignacionRepository.listarPorActivo(request.activoId);
    return Result.ok(historial);
  }
}
