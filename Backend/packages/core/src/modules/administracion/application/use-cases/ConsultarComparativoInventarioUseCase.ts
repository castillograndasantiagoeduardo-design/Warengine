import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import type {
  IMetricasAdminRepository,
  ItemComparativoInventario,
} from '../../domain/repositories/IMetricasAdminRepository.ts';

export interface ConsultarComparativoInventarioRequest {
  usuarioId: string;
  productoId?: string;
  categoriaId?: number;
  sucursalIds?: number[];
  soloConStockBajo?: boolean;
}

export type ConsultarComparativoInventarioResponse = Result<ItemComparativoInventario[], DomainError>;

/**
 * RF-ADM-C4 (SRS): Vista comparativa de niveles de inventario/existencias entre sucursales.
 * RNF-ADM-04: Control de visibilidad según sucursales permitidas del operador.
 */
export class ConsultarComparativoInventarioUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly metricasRepository: IMetricasAdminRepository,
  ) {}

  public async execute(request: ConsultarComparativoInventarioRequest): Promise<ConsultarComparativoInventarioResponse> {
    const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);

    let sucursalIds = request.sucursalIds;

    if (sucursalIds && sucursalIds.length > 0) {
      for (const id of sucursalIds) {
        if (!alcance.value.permite(id)) {
          return Result.fail(new SucursalFueraDeAlcanceError());
        }
      }
    } else if (!alcance.value.esGlobal) {
      sucursalIds = alcance.value.sucursalesPermitidas();
      if (!sucursalIds || sucursalIds.length === 0) {
        return Result.ok([]);
      }
    }

    const inventarios = await this.metricasRepository.obtenerComparativoInventario({
      productoId: request.productoId,
      categoriaId: request.categoriaId,
      sucursalIds,
      soloConStockBajo: request.soloConStockBajo,
    });

    return Result.ok(inventarios);
  }
}
