import { Result, DomainError } from '@warengine/shared-kernel';
import type { ActivoConsultaResponse } from '@warengine/contracts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { IAsignacionActivoRepository } from '../../domain/repositories/IAsignacionActivoRepository.ts';
import { IMantenimientoActivoRepository } from '../../domain/repositories/IMantenimientoActivoRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ActivoNoEncontradoError } from '../../domain/errors/LogisticaErrors.ts';

export interface ConsultarActivoRequest {
  activoId: string;
  usuarioId: string;
}

export type ConsultarActivoResponse = Result<ActivoConsultaResponse, DomainError>;

export class ConsultarActivoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly asignacionRepository: IAsignacionActivoRepository,
    private readonly mantenimientoRepository: IMantenimientoActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ConsultarActivoRequest): Promise<ConsultarActivoResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    const asignacionActiva = await this.asignacionRepository.findActivaPorActivo(activo.id);
    const mantenimientoEnCurso = await this.mantenimientoRepository.findEnCursoPorActivo(activo.id);

    const dto: ActivoConsultaResponse = {
      id: activo.id,
      codigoActivo: activo.codigoActivo,
      nombre: activo.nombre,
      categoriaActivoId: activo.categoriaActivoId,
      categoriaNombre: activo.categoriaNombre,
      sucursalId: activo.sucursalId,
      estado: activo.estado,
      valorAdquisicion: activo.valorAdquisicion,
      fechaAdquisicion: activo.fechaAdquisicion,
      condicion: activo.condicion,
      isActive: activo.isActive,
      responsableActual: asignacionActiva
        ? {
            tipo: asignacionActiva.empleadoId ? 'empleado' : 'area',
            id: asignacionActiva.empleadoId ?? asignacionActiva.areaId!,
            nombre: asignacionActiva.empleadoNombre ?? asignacionActiva.areaNombre,
            desde: asignacionActiva.fechaAsignacion.toISOString(),
          }
        : null,
      mantenimientoEnCurso: mantenimientoEnCurso !== null,
    };

    return Result.ok(dto);
  }
}
