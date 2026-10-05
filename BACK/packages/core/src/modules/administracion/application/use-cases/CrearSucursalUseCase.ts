import { Result, DomainError } from '@warengine/shared-kernel';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { Sucursal } from '../../domain/entities/Sucursal.ts';

export interface CrearSucursalRequest {
  nombre: string;
  direccion?: string;
  contacto?: string;
}

export type CrearSucursalResponse = Result<Sucursal, DomainError>;

export class CrearSucursalUseCase {
  constructor(private readonly sucursalRepository: ISucursalRepository) {}

  public async execute(request: CrearSucursalRequest): Promise<CrearSucursalResponse> {
    const sucursal = await this.sucursalRepository.crear({
      nombre: request.nombre,
      direccion: request.direccion ?? null,
      contacto: request.contacto ?? null,
    });
    return Result.ok(sucursal);
  }
}