import { Result, DomainError } from '@warengine/shared-kernel';
import { Activo } from '../../domain/entities/Activo.ts';
import { IActivoRepository, DatosActualizarActivo } from '../../domain/repositories/IActivoRepository.ts';
import { ICategoriaActivoRepository } from '../../domain/repositories/ICategoriaActivoRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  ActivoNoEncontradoError,
  ActivoDeBajaError,
  CategoriaActivoNoEncontradaError,
  CategoriaActivoInactivaError,
} from '../../domain/errors/LogisticaErrors.ts';

export interface EditarActivoRequest {
  activoId: string;
  nombre?: string;
  categoriaActivoId?: number | null;
  valorAdquisicion?: number | null;
  fechaAdquisicion?: string | null;
  condicion?: string | null;
  actor: ActorAuditoria;
}

export type EditarActivoResponse = Result<Activo, DomainError>;

export class EditarActivoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly categoriaActivoRepository: ICategoriaActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarActivoRequest): Promise<EditarActivoResponse> {
    const activo = await this.activoRepository.findById(request.activoId);
    if (!activo) return Result.fail(new ActivoNoEncontradoError());

    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);
    if (!alcanceResult.value.permite(activo.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    if (activo.estaDeBaja) {
      return Result.fail(new ActivoDeBajaError());
    }

    if (request.categoriaActivoId !== undefined && request.categoriaActivoId !== null) {
      const categoria = await this.categoriaActivoRepository.findById(request.categoriaActivoId);
      if (!categoria) return Result.fail(new CategoriaActivoNoEncontradaError());
      if (!categoria.isActive) return Result.fail(new CategoriaActivoInactivaError());
    }

    const cambios: DatosActualizarActivo = {};
    if (request.nombre !== undefined) cambios.nombre = request.nombre.trim();
    if (request.categoriaActivoId !== undefined) cambios.categoriaActivoId = request.categoriaActivoId;
    if (request.valorAdquisicion !== undefined) cambios.valorAdquisicion = request.valorAdquisicion;
    if (request.fechaAdquisicion !== undefined) cambios.fechaAdquisicion = request.fechaAdquisicion;
    if (request.condicion !== undefined) cambios.condicion = request.condicion;

    const actualizado = await this.activoRepository.actualizar(activo.id, cambios);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.ACTIVOS,
      entidadId: activo.id,
      detalles: {
        antes: {
          nombre: activo.nombre,
          categoriaActivoId: activo.categoriaActivoId,
          valorAdquisicion: activo.valorAdquisicion,
          condicion: activo.condicion,
        },
        despues: {
          nombre: actualizado.nombre,
          categoriaActivoId: actualizado.categoriaActivoId,
          valorAdquisicion: actualizado.valorAdquisicion,
          condicion: actualizado.condicion,
        },
      },
    });

    return Result.ok(actualizado);
  }
}
