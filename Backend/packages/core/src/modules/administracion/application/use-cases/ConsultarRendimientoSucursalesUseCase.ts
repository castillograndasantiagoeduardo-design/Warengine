import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { RangoFechasInvalidoError } from '../../domain/errors/AdministracionErrors.ts';
import type {
  IMetricasAdminRepository,
  RendimientoSucursal,
} from '../../domain/repositories/IMetricasAdminRepository.ts';

export interface ConsultarRendimientoSucursalesRequest {
  usuarioId: string;
  sucursalIds?: number[];
  desde?: Date;
  hasta?: Date;
}

export type ConsultarRendimientoSucursalesResponse = Result<RendimientoSucursal[], DomainError>;

/**
 * RF-ADM-A3: Comparativo de rendimiento y volumen de ventas entre sucursales.
 * RNF-ADM-04: Super Admin compara todas; Admin de Sucursal solo sus sedes asignadas.
 */
export class ConsultarRendimientoSucursalesUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly metricasRepository: IMetricasAdminRepository,
  ) {}

  public async execute(request: ConsultarRendimientoSucursalesRequest): Promise<ConsultarRendimientoSucursalesResponse> {
    if (request.desde && request.hasta && request.desde > request.hasta) {
      return Result.fail(new RangoFechasInvalidoError());
    }

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

    const rendimientos = await this.metricasRepository.obtenerRendimientoSucursales({
      sucursalIds,
      desde: request.desde,
      hasta: request.hasta,
    });

    return Result.ok(rendimientos);
  }
}
