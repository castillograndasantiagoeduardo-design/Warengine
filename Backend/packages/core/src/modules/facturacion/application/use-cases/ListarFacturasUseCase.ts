import { DomainError, Result } from '@warengine/shared-kernel';
import { Factura } from '../../domain/entities/Factura.ts';
import { IFacturaRepository } from '../../domain/repositories/IFacturaRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { OperadorSinSucursalError } from '../../domain/errors/TurnoCajaErrors.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { PERMISSIONS } from '@warengine/contracts';

export interface ListarFacturasRequest {
    clienteId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    estado?: 'emitida' | 'anulada';
    sucursalId?: number;
    limite?: number;
    offset?: number;
    actor: ActorAuditoria;
}

export type ListarFacturasResponse = Result<Factura[], DomainError>;

export class ListarFacturasUseCase {
    constructor(
        private readonly facturaRepository: IFacturaRepository,
        private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
    ) { }

    public async execute(request: ListarFacturasRequest): Promise<ListarFacturasResponse> {
        const esGlobal = request.actor.permisos?.includes(PERMISSIONS.ADMIN_VER_METRICAS_GLOBALES) ?? false;
        let sucursalIdFiltro: number | undefined = undefined;

        if (esGlobal) {
            sucursalIdFiltro = request.sucursalId;
        } else {
            const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(request.actor.usuarioId);
            if (sucursalId === null) {
                return Result.fail(new OperadorSinSucursalError());
            }
            sucursalIdFiltro = sucursalId;
        }

        const facturas = await this.facturaRepository.listar({
            sucursalId: sucursalIdFiltro,
            clienteId: request.clienteId,
            fechaInicio: request.fechaInicio,
            fechaFin: request.fechaFin,
            estado: request.estado,
            limite: request.limite ?? 20,
            offset: request.offset ?? 0,
        });

        return Result.ok(facturas);
    }
}
