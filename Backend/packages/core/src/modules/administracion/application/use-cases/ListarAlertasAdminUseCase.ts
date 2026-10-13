/**
 * ListarAlertasAdminUseCase.ts
 *
 * Caso de uso para consultar alertas administrativas respetando el alcance por sucursal (RF-ADM-C13).
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { AlertaAdmin, EstadoAlerta, PrioridadAlerta } from '../../domain/entities/AlertaAdmin.ts';
import { IAlertaAdminRepository } from '../../domain/repositories/IAlertaAdminRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';

export interface ListarAlertasAdminRequest {
  usuarioId: string;
  sucursalId?: number;
  estado?: EstadoAlerta;
  prioridad?: PrioridadAlerta;
}

export type ListarAlertasAdminResponse = Result<AlertaAdmin[], DomainError>;

export class ListarAlertasAdminUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly alertaAdminRepository: IAlertaAdminRepository,
  ) {}

  public async execute(request: ListarAlertasAdminRequest): Promise<ListarAlertasAdminResponse> {
    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcanceResult.isFailure) {
      return Result.fail(alcanceResult.error);
    }

    const alcance = alcanceResult.value;
    let sucursalIds: number[] | undefined;

    if (request.sucursalId !== undefined) {
      if (!alcance.permite(request.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
      sucursalIds = [request.sucursalId];
    } else {
      sucursalIds = alcance.sucursalesPermitidas();
    }

    if (sucursalIds !== undefined && sucursalIds.length === 0) {
      return Result.ok([]);
    }

    const alertas = await this.alertaAdminRepository.listar({
      sucursalIds,
      estado: request.estado,
      prioridad: request.prioridad,
    });

    return Result.ok(alertas);
  }
}
