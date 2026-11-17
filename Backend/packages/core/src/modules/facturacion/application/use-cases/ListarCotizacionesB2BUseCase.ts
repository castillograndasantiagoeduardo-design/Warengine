import { DomainError, Result } from '@warengine/shared-kernel';
import type { EstadoCotizacionB2B, EstadoPedidoB2B } from '@warengine/contracts';
import { CotizacionB2B } from '../../domain/entities/CotizacionB2B.ts';
import { ICotizacionB2BRepository } from '../../domain/repositories/ICotizacionB2BRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import type { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ListarCotizacionesB2BRequest {
  estado?: EstadoCotizacionB2B;
  estadoPedido?: EstadoPedidoB2B;
  clienteId?: string;
  sucursalId?: number;
  limite?: number;
  offset?: number;
  actor: ActorAuditoria;
}

export type ListarCotizacionesB2BResponse = Result<CotizacionB2B[], DomainError>;

export class ListarCotizacionesB2BUseCase {
  constructor(
    private readonly cotizacionRepository: ICotizacionB2BRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ListarCotizacionesB2BRequest): Promise<ListarCotizacionesB2BResponse> {
    const alcanceRes = await this.resolverAlcance.execute({ usuarioId: request.actor.usuarioId });
    if (alcanceRes.isFailure) return Result.fail(alcanceRes.error);
    const alcance = alcanceRes.value;

    let sucursalIds = alcance.sucursalesPermitidas();
    if (request.sucursalId !== undefined) {
      if (!alcance.permite(request.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
      sucursalIds = [request.sucursalId];
    }

    const puedeAvalar =
      request.actor.permisos?.includes('facturacion:avalar-cotizacion-b2b') ?? false;

    const lista = await this.cotizacionRepository.listar({
      sucursalIds,
      vendedorId: !alcance.esGlobal && !puedeAvalar ? request.actor.usuarioId : undefined,
      clienteId: request.clienteId,
      estado: request.estado,
      estadoPedido: request.estadoPedido,
      limite: request.limite ?? 50,
      offset: request.offset ?? 0,
    });

    return Result.ok(lista);
  }
}
