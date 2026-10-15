import { DomainError, Result } from '@warengine/shared-kernel';
import { Factura } from '../../domain/entities/Factura.ts';
import { FacturaNoEncontradaError } from '../../domain/errors/FacturacionErrors.ts';
import { OperadorSinSucursalError } from '../../domain/errors/TurnoCajaErrors.ts';
import { IFacturaRepository } from '../../domain/repositories/IFacturaRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { PERMISSIONS } from '@warengine/contracts';

export interface ObtenerFacturaPorIdRequest {
    id: string;
    actor: ActorAuditoria;
}

export type ObtenerFacturaPorIdResponse = Result<Factura, DomainError>;

export class ObtenerFacturaPorIdUseCase {
    constructor(
        private readonly facturaRepository: IFacturaRepository,
        private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
    ) { }

    public async execute(request: ObtenerFacturaPorIdRequest): Promise<ObtenerFacturaPorIdResponse> {
        const factura = await this.facturaRepository.findById(request.id);
        if (!factura) {
            return Result.fail(new FacturaNoEncontradaError());
        }

        const esGlobal = request.actor.permisos?.includes(PERMISSIONS.ADMIN_VER_METRICAS_GLOBALES) ?? false;
        if (!esGlobal) {
            const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(request.actor.usuarioId);
            if (sucursalId === null) {
                return Result.fail(new OperadorSinSucursalError());
            }
            if (factura.sucursalId !== sucursalId) {
                return Result.fail(new FacturaNoEncontradaError());
            }
        }

        return Result.ok(factura);
    }
}
