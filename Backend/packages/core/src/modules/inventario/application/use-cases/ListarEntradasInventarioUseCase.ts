import { DomainError, Result } from '@warengine/shared-kernel';
import {
  FiltrosKardex,
  IMovimientoInventarioRepository,
  ResultadoKardex,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ListarEntradasRequest {
  sucursalId?: number;
  proveedorId?: number;
  productoId?: string;
  desde?: Date;
  hasta?: Date;
  limit: number;
  offset: number;
  actor: ActorAuditoria;
}

export type ListarEntradasResponse = Result<ResultadoKardex, DomainError>;

/**
 * Caso de uso: ListarEntradasInventarioUseCase (RF-ADM-B15)
 *
 * Permite listar las entradas de mercancía registradas, con filtros por fecha,
 * proveedor, producto y sucursal.
 *
 * RNF-ADM-04: Aislamiento de sede. Un usuario con alcance limitado solo puede
 * consultar las entradas de las sucursales para las cuales tiene autorización.
 */
export class ListarEntradasInventarioUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ListarEntradasRequest): Promise<ListarEntradasResponse> {
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

    // 2. Construir filtros específicos para entradas
    const filtros: FiltrosKardex = {
      tipo: 'entrada',
      productoId: request.productoId,
      proveedorId: request.proveedorId,
      sucursalId: request.sucursalId,
      sucursalIds: sucursalIdsFiltro,
      desde: request.desde,
      hasta: request.hasta,
      limit: request.limit,
      offset: request.offset,
    };

    // 3. Consultar registros en repositorio
    const resultado = await this.movimientoRepository.consultarKardex(filtros);

    return Result.ok({
      items: resultado.items,
      total: resultado.total,
      limit: request.limit,
      offset: request.offset,
    });
  }
}
