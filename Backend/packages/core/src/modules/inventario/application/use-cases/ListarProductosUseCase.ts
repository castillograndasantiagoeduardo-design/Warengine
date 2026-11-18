import { Result, DomainError, type ResultadoPaginado } from '@warengine/shared-kernel';
import {
  IProductoRepository,
  FiltrosListarProductos,
  ResumenStockSede,
} from '../../domain/repositories/IProductoRepository.ts';
import { ProductoResponse, ResumenInventarioSede } from '@warengine/contracts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { toProductoResponse } from '../mappers/producto-response.mapper.ts';

export interface ListarProductosRequest extends FiltrosListarProductos {
  actor?: ActorAuditoria;
}

export interface ResultadoListarProductosResponse extends ResultadoPaginado<ProductoResponse> {
  resumen?: ResumenInventarioSede;
  contadores?: ResumenInventarioSede;
}

export type ListarProductosResponse = Result<ResultadoListarProductosResponse, DomainError>;

export class ListarProductosUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ListarProductosRequest): Promise<ListarProductosResponse> {
    let sucursalIdFiltro = request.sucursalId;

    if (this.resolverAlcance && request.actor) {
      const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
      if (alcanceResult.isFailure) {
        return Result.fail(alcanceResult.error);
      }
      const alcance = alcanceResult.value;

      if (sucursalIdFiltro !== undefined) {
        if (!alcance.permite(sucursalIdFiltro)) {
          return Result.fail(new SucursalFueraDeAlcanceError());
        }
      } else if (!alcance.esGlobal) {
        const autorizadas = alcance.sucursalesPermitidas() ?? [];
        if (autorizadas.length > 0) {
          sucursalIdFiltro = autorizadas[0];
        }
      }
    }

    const resultado = await this.productoRepository.listar({
      ...request,
      sucursalId: sucursalIdFiltro,
    });
    const items = resultado.items.map((prod) => toProductoResponse(prod, request.actor?.permisos));
    return Result.ok({
      ...resultado,
      items,
    });
  }
}
