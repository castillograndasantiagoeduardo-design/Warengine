import { DomainError, Result } from '@warengine/shared-kernel';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { DatosDetalleStockSucursal } from '../../domain/repositories/IInventarioSucursalRepository.ts';
import { IConsultaStockSucursalRepository } from '../../domain/repositories/IConsultaStockSucursalRepository.ts';

export interface ListarStockSucursalRequest {
  sucursalId: number;
  actor: ActorAuditoria;
}

export type ListarStockSucursalResponse = Result<DatosDetalleStockSucursal[], DomainError>;

/**
 * Existencias reales de una sede para vender (POS y B2B). Productos sin fila en la sede
 * no aparecen: para el cliente equivalen a stock 0.
 * RNF-ADM-04: solo sedes dentro del alcance del actor. Solo lectura: no audita.
 */
export class ListarStockSucursalUseCase {
  constructor(
    private readonly consultaStock: IConsultaStockSucursalRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ListarStockSucursalRequest): Promise<ListarStockSucursalResponse> {
    const alcance = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);
    if (!alcance.value.permite(request.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    return Result.ok(await this.consultaStock.listarPorSucursal(request.sucursalId));
  }
}
