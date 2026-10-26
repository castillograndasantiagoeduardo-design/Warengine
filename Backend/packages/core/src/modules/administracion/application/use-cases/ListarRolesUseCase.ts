/**
 * ListarRolesUseCase.ts
 *
 * Devuelve el catálogo de roles para el selector de cambio de rol (RF-ADM-C7).
 * Consulta de solo lectura: no audita.
 */
import { DomainError, Result } from '@warengine/shared-kernel';
import { IRolCatalogoRepository } from '../../domain/repositories/IRolCatalogoRepository.ts';
import { RolResumen } from '../../domain/entities/RolResumen.ts';

export type ListarRolesResponse = Result<RolResumen[], DomainError>;

export class ListarRolesUseCase {
  constructor(private readonly rolCatalogoRepository: IRolCatalogoRepository) {}

  public async execute(): Promise<ListarRolesResponse> {
    return Result.ok(await this.rolCatalogoRepository.listarRoles());
  }
}
