import { DomainError, Result } from '@warengine/shared-kernel';
import { Factura } from '../../domain/entities/Factura.ts';
import {
    FacturaNoEncontradaError,
    FacturaYaAnuladaError,
    MotivoAnulacionFacturaRequeridoError,
} from '../../domain/errors/FacturacionErrors.ts';
import { OperadorSinSucursalError } from '../../domain/errors/TurnoCajaErrors.ts';
import { IFacturaRepository } from '../../domain/repositories/IFacturaRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { PERMISSIONS } from '@warengine/contracts';

export interface AnularFacturaRequest {
    id: string;
    motivo: string;
    actor: ActorAuditoria;
}

export type AnularFacturaResponse = Result<Factura, DomainError>;

/**
 * Caso de uso: AnularFacturaUseCase (RF-FMC-E10)
 *
 * Anula administrativamente una factura emitida por error:
 * 1. Exige motivo obligatorio (mínimo 5 caracteres).
 * 2. La factura debe existir y estar dentro del alcance de sede del actor.
 * 3. Rechaza si ya está anulada.
 * 4. Cambia el estado a 'anulada' registrando quién la anula (anulada_por).
 *    El trigger trg_facturas_anula_reingresa_stock reingresa al kardex lo vendido,
 *    descontando lo ya devuelto con reingreso (no se duplica stock).
 * 5. Audita la operación con el motivo (el log de auditoría es inmutable).
 *
 * El permiso 'facturacion:anular' se valida en el middleware de la ruta (RBAC).
 */
export class AnularFacturaUseCase {
    constructor(
        private readonly facturaRepository: IFacturaRepository,
        private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(request: AnularFacturaRequest): Promise<AnularFacturaResponse> {
        // 1. Motivo obligatorio
        const motivo = request.motivo?.trim();
        if (!motivo || motivo.length < 5) {
            return Result.fail(new MotivoAnulacionFacturaRequeridoError());
        }

        // 2. La factura debe existir
        const factura = await this.facturaRepository.findById(request.id);
        if (!factura) {
            return Result.fail(new FacturaNoEncontradaError());
        }

        // 3. Alcance de sede: quien no es global solo anula facturas de su sucursal
        const esGlobal = request.actor.permisos?.includes(PERMISSIONS.ADMIN_VER_METRICAS_GLOBALES) ?? false;
        if (!esGlobal) {
            const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(request.actor.usuarioId);
            if (sucursalId === null) {
                return Result.fail(new OperadorSinSucursalError());
            }
            if (factura.sucursalId !== sucursalId) {
                // No se revela que la factura existe en otra sede
                return Result.fail(new FacturaNoEncontradaError());
            }
        }

        // 4. Idempotencia: no se anula dos veces
        if (factura.estado === 'anulada') {
            return Result.fail(new FacturaYaAnuladaError());
        }

        // 5. Anulación atómica (el UPDATE solo afecta filas 'emitida'; si otra
        //    petición se adelantó, el repositorio devuelve null)
        const anulada = await this.facturaRepository.anular(factura.id, request.actor.usuarioId);
        if (!anulada) {
            return Result.fail(new FacturaYaAnuladaError());
        }

        // 6. Auditoría
        await this.auditor.registrar({
            actor: request.actor,
            accion: ACCIONES_AUDITORIA.ANULAR,
            entidad: ENTIDADES_AUDITORIA.FACTURAS,
            entidadId: anulada.id,
            detalles: {
                motivo,
                antes: { estado: 'emitida' },
                despues: { estado: 'anulada', anuladaPor: request.actor.usuarioId },
                consecutivo: anulada.consecutivo,
                total: anulada.total,
                sucursalId: anulada.sucursalId,
                clienteId: anulada.clienteId,
                itemsCount: anulada.items.length,
            },
        });

        return Result.ok(anulada);
    }
}
