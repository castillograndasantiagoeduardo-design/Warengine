/**
 * ObtenerDetalleSucursalUseCase.ts
 *
 * Caso de uso para obtener la ficha de detalle consolidada de una sucursal.
 *
 * Requisito SRS:
 * - RF-ADM-C18: Ficha de detalle de sucursal con datos de contacto, usuarios asignados,
 *   cantidad de productos con stock y resumen de ventas recientes.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { SucursalDetalle } from '../../domain/entities/SucursalDetalle.ts';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { SucursalNoEncontradaError } from '../../domain/errors/AdministracionErrors.ts';

export interface ObtenerDetalleSucursalRequest {
  id: number;
}

export type ObtenerDetalleSucursalResponse = Result<SucursalDetalle, DomainError>;

export class ObtenerDetalleSucursalUseCase {
  constructor(private readonly sucursalRepository: ISucursalRepository) {}

  public async execute(
    request: ObtenerDetalleSucursalRequest,
  ): Promise<ObtenerDetalleSucursalResponse> {
    if (!this.sucursalRepository.obtenerDetalle) {
      const sucursal = await this.sucursalRepository.findById(request.id);
      if (!sucursal) {
        return Result.fail(new SucursalNoEncontradaError());
      }
      return Result.ok(
        new SucursalDetalle(
          sucursal.id,
          sucursal.nombre,
          sucursal.direccion,
          sucursal.contacto,
          sucursal.isActive,
          [],
          {
            totalUsuariosAsignados: 0,
            productosConStock: 0,
            totalUnidadesStock: 0,
            totalVentas: 0,
            montoTotalVentas: 0,
          },
          [],
        ),
      );
    }

    const detalle = await this.sucursalRepository.obtenerDetalle(request.id);
    if (!detalle) {
      return Result.fail(new SucursalNoEncontradaError());
    }

    return Result.ok(detalle);
  }
}
