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
    desde?: Date;
    hasta?: Date;
    estado?: 'emitida' | 'anulada';
    texto?: string;
    tipo?: string;
    sucursalId?: number;
    page?: number;
    limite?: number;
    offset?: number;
    actor: ActorAuditoria;
}

export interface FacturasPaginadas {
    items: Factura[];
    total: number;
    totalPaginas: number;
    page: number;
    limite: number;
}

export type ListarFacturasResponse = Result<FacturasPaginadas, DomainError>;

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

        const limite = Math.min(Math.max(request.limite ?? 20, 1), 100);
        const page = Math.max(request.page ?? (request.offset !== undefined ? Math.floor(request.offset / limite) + 1 : 1), 1);
        const offset = request.offset !== undefined ? request.offset : (page - 1) * limite;
        const fechaInicio = request.desde ?? request.fechaInicio;
        const fechaFin = request.hasta ?? request.fechaFin;

        const filtros = {
            sucursalId: sucursalIdFiltro,
            clienteId: request.clienteId,
            fechaInicio,
            fechaFin,
            estado: request.estado,
            texto: request.texto,
            tipo: request.tipo,
            limite,
            offset,
        };

        let resultado: { items: Factura[]; total: number };
        if (this.facturaRepository.listarPaginado) {
            resultado = await this.facturaRepository.listarPaginado(filtros);
        } else {
            const items = await this.facturaRepository.listar(filtros);
            resultado = { items, total: items.length };
        }

        const totalPaginas = Math.ceil(resultado.total / limite);

        return Result.ok({
            items: resultado.items,
            total: resultado.total,
            totalPaginas,
            page,
            limite,
        });
    }
}
