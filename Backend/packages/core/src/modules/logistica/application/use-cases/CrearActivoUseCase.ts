import { Result, DomainError } from '@warengine/shared-kernel';
import { Activo } from '../../domain/entities/Activo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { ICategoriaActivoRepository } from '../../domain/repositories/ICategoriaActivoRepository.ts';
import { ISucursalRepository } from '../../../administracion/domain/repositories/ISucursalRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  SucursalNoEncontradaError,
  SucursalInactivaError,
} from '../../../administracion/domain/errors/AdministracionErrors.ts';
import {
  CodigoActivoDuplicadoError,
  CategoriaActivoNoEncontradaError,
  CategoriaActivoInactivaError,
} from '../../domain/errors/LogisticaErrors.ts';

export interface CrearActivoRequest {
  codigoActivo: string;
  nombre: string;
  categoriaActivoId?: number;
  sucursalId: number;
  valorAdquisicion?: number;
  fechaAdquisicion?: string;
  condicion?: string;
  actor: ActorAuditoria;
}

export type CrearActivoResponse = Result<Activo, DomainError>;

export class CrearActivoUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly categoriaActivoRepository: ICategoriaActivoRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearActivoRequest): Promise<CrearActivoResponse> {
    // Validar alcance
    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceResult.isFailure) {
      return Result.fail(alcanceResult.error);
    }
    const alcance = alcanceResult.value;
    if (!alcance.permite(request.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    // Validar sucursal
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }
    if (!sucursal.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    // Validar categoria si viene
    if (request.categoriaActivoId !== undefined) {
      const categoria = await this.categoriaActivoRepository.findById(request.categoriaActivoId);
      if (!categoria) {
        return Result.fail(new CategoriaActivoNoEncontradaError());
      }
      if (!categoria.isActive) {
        return Result.fail(new CategoriaActivoInactivaError());
      }
    }

    // Validar codigo unico
    const codigoLimpio = request.codigoActivo.trim();
    const existente = await this.activoRepository.findByCodigo(codigoLimpio);
    if (existente) {
      return Result.fail(new CodigoActivoDuplicadoError(codigoLimpio));
    }

    const activo = await this.activoRepository.crear({
      codigoActivo: codigoLimpio,
      nombre: request.nombre.trim(),
      categoriaActivoId: request.categoriaActivoId ?? null,
      sucursalId: request.sucursalId,
      valorAdquisicion: request.valorAdquisicion ?? null,
      fechaAdquisicion: request.fechaAdquisicion ?? null,
      condicion: request.condicion ?? null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.ACTIVOS,
      entidadId: activo.id,
      detalles: {
        despues: {
          codigoActivo: activo.codigoActivo,
          nombre: activo.nombre,
          categoriaActivoId: activo.categoriaActivoId,
          sucursalId: activo.sucursalId,
          valorAdquisicion: activo.valorAdquisicion,
          fechaAdquisicion: activo.fechaAdquisicion,
          condicion: activo.condicion,
        },
      },
    });

    return Result.ok(activo);
  }
}
