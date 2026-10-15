import { DomainError, Result } from '@warengine/shared-kernel';
import {
  FiltrosKardex,
  IMovimientoInventarioRepository,
  ResultadoKardex,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ConsultarKardexRequest {
  productoId?: string;
  sucursalId?: number;
  tipo?: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida';
  desde?: Date;
  hasta?: Date;
  limit: number;
  offset: number;
  actor: ActorAuditoria;
}

export type ConsultarKardexResponse = Result<ResultadoKardex, DomainError>;

/**
 * RF-ADM-B10: Historial de movimientos (Kardex).
 * Trazabilidad cronológica de entradas, salidas y ajustes por producto y sucursal.
 * RNF-ADM-04: Aislamiento de sede. Un Administrador de Sucursal solo puede ver
 * los movimientos de sus sucursales autorizadas. Super Admin tiene visibilidad transversal.
 */
export class ConsultarKardexUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ConsultarKardexRequest): Promise<ConsultarKardexResponse> {
    let sucursalIdsFiltro: number[] | undefined = undefined;

    // 1. Resolver alcance de sucursal del actor (RNF-ADM-04)
    if (this.resolverAlcance) {
      const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
      if (alcanceResult.isFailure) {
        return Result.fail(alcanceResult.error);
      }

      const alcance = alcanceResult.value;

      // Si el cliente especificó una sucursal, verificar que esté dentro de su alcance
      if (request.sucursalId !== undefined) {
        if (!alcance.permite(request.sucursalId)) {
          return Result.fail(new SucursalFueraDeAlcanceError());
        }
      } else if (!alcance.esGlobal) {
        // Si el usuario tiene alcance limitado y no envió sucursalId, acotar a sus sedes autorizadas
        const autorizadas = alcance.sucursalesPermitidas() ?? [];
        if (autorizadas.length === 0) {
          return Result.ok({
            items: [],
            total: 0,
            limit: request.limit,
            offset: request.offset,
          });
        }
        sucursalIdsFiltro = autorizadas;
      }
    }

    // 2. Construir filtros de persistencia
    const filtros: FiltrosKardex = {
      productoId: request.productoId,
      sucursalId: request.sucursalId,
      sucursalIds: sucursalIdsFiltro,
      tipo: request.tipo,
      desde: request.desde,
      hasta: request.hasta,
      limit: request.limit,
      offset: request.offset,
    };

    // 3. Consultar histórico en el repositorio
    const resultado = await this.movimientoRepository.consultarKardex(filtros);

    return Result.ok({
      items: resultado.items,
      total: resultado.total,
      limit: request.limit,
      offset: request.offset,
    });
  }
}
