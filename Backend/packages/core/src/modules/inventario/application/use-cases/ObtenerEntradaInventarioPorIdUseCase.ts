import { DomainError, Result } from '@warengine/shared-kernel';
import {
  IMovimientoInventarioRepository,
  ItemKardex,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { EntradaNoEncontradaError } from '../../domain/errors/InventarioErrors.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ObtenerEntradaPorIdRequest {
  id: string;
  actor: ActorAuditoria;
}

export type ObtenerEntradaPorIdResponse = Result<ItemKardex, DomainError>;

/**
 * Caso de uso: ObtenerEntradaInventarioPorIdUseCase (RF-ADM-B15)
 *
 * Permite consultar el detalle completo de una entrada de mercancía específica,
 * incluyendo producto, cantidades, proveedor, usuario responsable y sede.
 *
 * RNF-ADM-04: Aislamiento de sede. Si la entrada pertenece a una sucursal no autorizada
 * para el usuario, se rechaza la consulta con 403 Forbidden.
 */
export class ObtenerEntradaInventarioPorIdUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ObtenerEntradaPorIdRequest): Promise<ObtenerEntradaPorIdResponse> {
    // 1. Consultar movimiento por id
    const movimiento = await this.movimientoRepository.obtenerPorId(request.id);
    if (!movimiento || movimiento.tipo !== 'entrada') {
      return Result.fail(new EntradaNoEncontradaError());
    }

    // 2. Validar alcance de sucursal (RNF-ADM-04)
    if (this.resolverAlcance) {
      const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
      if (alcanceResult.isFailure) {
        return Result.fail(alcanceResult.error);
      }

      const alcance = alcanceResult.value;
      if (!alcance.permite(movimiento.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    }

    return Result.ok(movimiento);
  }
}
