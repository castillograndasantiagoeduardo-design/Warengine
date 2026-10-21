import { Result, DomainError } from '@warengine/shared-kernel';
import { MantenimientoActivo } from '../../domain/entities/MantenimientoActivo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IMantenimientoActivoRepository } from '../../domain/repositories/IMantenimientoActivoRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ActivoNoEncontradoError } from '../../domain/errors/LogisticaErrors.ts';

export interface ConsultarHistorialMantenimientosRequest {
  activoId: string;
  usuarioId: string;
}

export type ConsultarHistorialMantenimientosResponse = Result<MantenimientoActivo[], DomainError>;

export class ConsultarHistorialMantenimientosUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly mantenimientoRepository: IMantenimientoActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ConsultarHistorialMantenimientosRequest): Promise<ConsultarHistorialMantenimientosResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    const historial = await this.mantenimientoRepository.listarPorActivo(request.activoId);
    return Result.ok(historial);
  }
}
