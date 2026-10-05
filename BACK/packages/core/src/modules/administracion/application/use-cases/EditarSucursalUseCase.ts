import { Result, DomainError } from '@warengine/shared-kernel';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { Sucursal } from '../../domain/entities/Sucursal.ts';
import { SucursalNoEncontradaError } from '../../domain/errors/AdministracionErrors.ts';

export interface EditarSucursalRequest {
  id: number;
  nombre?: string;
  direccion?: string;
  contacto?: string;
  isActive?: boolean;
}

export type EditarSucursalResponse = Result<Sucursal, DomainError>;

export class EditarSucursalUseCase {
  constructor(private readonly sucursalRepository: ISucursalRepository) {}

  public async execute(request: EditarSucursalRequest): Promise<EditarSucursalResponse> {
    const existente = await this.sucursalRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new SucursalNoEncontradaError());
    }

    const { id, ...cambios } = request;
    const actualizada = await this.sucursalRepository.actualizar(id, cambios);
    return Result.ok(actualizada);
  }
}