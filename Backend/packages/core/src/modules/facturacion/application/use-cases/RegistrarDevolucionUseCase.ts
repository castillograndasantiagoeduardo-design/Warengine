import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS } from '@warengine/contracts';
import { DevolucionVenta } from '../../domain/entities/DevolucionVenta.ts';
import {
    CantidadDevolucionExcedidaError,
    DevolucionInvalidaError,
    FacturaAnuladaError,
    FacturaNoEncontradaError,
    ItemFacturaNoEncontradoError,
} from '../../domain/errors/FacturacionErrors.ts';
import { OperadorSinSucursalError } from '../../domain/errors/TurnoCajaErrors.ts';
import { IFacturaRepository } from '../../domain/repositories/IFacturaRepository.ts';
import { IDevolucionVentaRepository } from '../../domain/repositories/IDevolucionVentaRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA, ActorAuditoria, ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ItemDevolucionRequest { facturaItemId: string; cantidad: number; }

export interface RegistrarDevolucionRequest {
    facturaId: string;
    motivo: string;
    reingresaStock: boolean;
    devolverTodo: boolean;
    items: ItemDevolucionRequest[];
    actor: ActorAuditoria;
}

export type RegistrarDevolucionResponse = Result<DevolucionVenta[], DomainError>;

export class RegistrarDevolucionUseCase {
    constructor(
        private readonly facturaRepository: IFacturaRepository,
        private readonly devolucionRepository: IDevolucionVentaRepository,
        private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(req: RegistrarDevolucionRequest): Promise<RegistrarDevolucionResponse> {
        const motivo = req.motivo?.trim() ?? '';
        if (motivo.length < 5) {
            return Result.fail(new DevolucionInvalidaError('El motivo de la devolución es obligatorio.'));
        }

        // 1. Factura + alcance de sucursal (mismo patrón que ObtenerFacturaPorIdUseCase)
        const factura = await this.facturaRepository.findById(req.facturaId);
        if (!factura) return Result.fail(new FacturaNoEncontradaError());

        const esGlobal = req.actor.permisos?.includes(PERMISSIONS.ADMIN_VER_METRICAS_GLOBALES) ?? false;
        if (!esGlobal) {
            const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(req.actor.usuarioId);
            if (sucursalId === null) return Result.fail(new OperadorSinSucursalError());
            if (factura.sucursalId !== sucursalId) return Result.fail(new FacturaNoEncontradaError());
        }

        // 2. Estado
        if (factura.estado === 'anulada') return Result.fail(new FacturaAnuladaError());

        // 3. Lo ya devuelto por línea
        const previo = await this.devolucionRepository.resumenDevueltoPorFactura(factura.id);

        // 4. Resolver qué se devuelve (total = todo el remanente; parcial = items)
        const solicitados = new Map<string, number>();
        if (req.devolverTodo) {
            for (const it of factura.items) {
                const restante = it.cantidad - (previo.get(it.id)?.cantidad ?? 0);
                if (restante > 0) solicitados.set(it.id, restante);
            }
            if (solicitados.size === 0) {
                return Result.fail(new CantidadDevolucionExcedidaError('La factura ya fue devuelta por completo.'));
            }
        } else {
            for (const it of req.items) {
                solicitados.set(it.facturaItemId, (solicitados.get(it.facturaItemId) ?? 0) + it.cantidad);
            }
        }

        // 5. Construir y validar cada línea (el trigger de BD queda como segunda barrera)
        const fecha = new Date();
        const devoluciones: DevolucionVenta[] = [];
        for (const [itemId, cantidad] of solicitados) {
            const item = factura.items.find((i) => i.id === itemId);
            if (!item) return Result.fail(new ItemFacturaNoEncontradoError());
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                return Result.fail(new DevolucionInvalidaError('La cantidad debe ser un entero mayor a 0.'));
            }
            const yaDev = previo.get(itemId)?.cantidad ?? 0;
            const yaMonto = previo.get(itemId)?.monto ?? 0;
            if (yaDev + cantidad > item.cantidad) {
                return Result.fail(new CantidadDevolucionExcedidaError(
                    `Solo quedan ${item.cantidad - yaDev} unidad(es) por devolver en esa línea.`));
            }
            devoluciones.push(new DevolucionVenta(
                crypto.randomUUID(), factura.id, itemId, cantidad, motivo,
                DevolucionVenta.calcularReembolso(item, cantidad, yaDev, yaMonto),
                req.reingresaStock, req.actor.usuarioId,
                factura.sucursalId, // el trigger exige la sucursal de la factura
                fecha,
            ));
        }

        // 6. Persistencia atómica (los triggers generan la entrada de kardex)
        const guardadas = await this.devolucionRepository.registrar(devoluciones);

        // 7. Auditoría
        await this.auditor.registrar({
            actor: req.actor,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES_AUDITORIA.DEVOLUCIONES_VENTAS,
            entidadId: factura.id,
            detalles: {
                despues: {
                    facturaId: factura.id,
                    consecutivo: factura.consecutivo,
                    tipo: req.devolverTodo ? 'total' : 'parcial',
                    reingresaStock: req.reingresaStock,
                    motivo,
                    totalReembolso: Math.round(guardadas.reduce((a, d) => a + d.montoReembolso, 0) * 100) / 100,
                    lineas: guardadas.map((d) => ({
                        id: d.id, facturaItemId: d.facturaItemId,
                        cantidad: d.cantidad, montoReembolso: d.montoReembolso,
                    })),
                },
            },
        });

        return Result.ok(guardadas);
    }
}