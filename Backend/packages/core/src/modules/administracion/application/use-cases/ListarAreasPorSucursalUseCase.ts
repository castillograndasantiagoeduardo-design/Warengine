/**
 * ListarAreasPorSucursalUseCase.ts
 *
 * Caso de uso para obtener todas las áreas funcionales asignadas a una sucursal específica.
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Orquesta la verificación de la existencia de la sucursal y la consulta de sus áreas.
 * - Retorna un `Result` funcional para evitar propagación de excepciones descontroladas.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Gestión y visualización de áreas por sucursal.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { Area } from '../../domain/entities/Area.ts';
import { IAreaRepository } from '../../domain/repositories/IAreaRepository.ts';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { SucursalNoEncontradaError } from '../../domain/errors/AdministracionErrors.ts';

export interface ListarAreasPorSucursalRequest {
  sucursalId: number;
}

export type ListarAreasPorSucursalResponse = Result<Area[], DomainError>;

export class ListarAreasPorSucursalUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly sucursalRepository: ISucursalRepository,
  ) {}

  public async execute(
    request: ListarAreasPorSucursalRequest,
  ): Promise<ListarAreasPorSucursalResponse> {
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }

    const areas = await this.areaRepository.listarPorSucursal(request.sucursalId);
    return Result.ok(areas);
  }
}
