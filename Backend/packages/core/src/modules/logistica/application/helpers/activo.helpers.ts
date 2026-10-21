import { DomainError, Result } from '@warengine/shared-kernel';
import type { ActivoResponse } from '@warengine/contracts';
import { Activo } from '../../domain/entities/Activo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { ActivoNoEncontradoError } from '../../domain/errors/LogisticaErrors.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';

export async function cargarActivoEnAlcance(
  activoRepository: IActivoRepository,
  resolverAlcance: ResolverAlcanceSucursalUseCase,
  activoId: string,
  usuarioId: string,
): Promise<Result<Activo, DomainError>> {
  const alcanceResult = await resolverAlcance.execute({ usuarioId });
  if (alcanceResult.isFailure) {
    return Result.fail(alcanceResult.error);
  }

  const activo = await activoRepository.findById(activoId);
  if (!activo || !alcanceResult.value.permite(activo.sucursalId)) {
    return Result.fail(new ActivoNoEncontradoError());
  }

  return Result.ok(activo);
}

export function aActivoResponse(activo: Activo): ActivoResponse {
  return {
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
  };
}

export function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}