import { DomainError, Result } from '@warengine/shared-kernel';
import { Factura } from '../../domain/entities/Factura.ts';
import { FacturaItem } from '../../domain/entities/FacturaItem.ts';
import { FacturaPago, MedioPago } from '../../domain/entities/FacturaPago.ts';
import {
    ClienteNoEncontradoError,
    ClienteRequeridoParaVentaB2BError,
    CreditoNoHabilitadoError,
    FacturacionSinTurnoAbiertoError,
    PagoInvalidoError,
    StockInsuficienteError,
} from '../../domain/errors/FacturacionErrors.ts';
import { OperadorSinSucursalError } from '../../domain/errors/TurnoCajaErrors.ts';
import { IFacturaRepository } from '../../domain/repositories/IFacturaRepository.ts';
import { ITurnoCajaRepository } from '../../domain/repositories/ITurnoCajaRepository.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ItemVentaRequest {
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
}

export interface PagoVentaRequest {
    medioPago: MedioPago;
    monto: number;
    referenciaTransaccion?: string | null;
}

export interface CrearFacturaRequest {
    clienteId: string;
    items: ItemVentaRequest[];
    pagos: PagoVentaRequest[];
    esB2B?: boolean;
    actor: ActorAuditoria;
}

export type CrearFacturaResponse = Result<Factura, DomainError>;

export class CrearFacturaUseCase {
    constructor(
        private readonly facturaRepository: IFacturaRepository,
        private readonly turnoRepository: ITurnoCajaRepository,
        private readonly clienteRepository: IClienteRepository,
        private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(request: CrearFacturaRequest): Promise<CrearFacturaResponse> {
        if (!request.items || request.items.length === 0) {
            return Result.fail(new PagoInvalidoError('La factura debe incluir al menos un producto.'));
        }
        if (!request.pagos || request.pagos.length === 0) {
            return Result.fail(new PagoInvalidoError('Debe incluir al menos un medio de pago.'));
        }

        // 1. Determinar sede de la venta
        const sucursalId = await this.sucursalOperadorRepository.obtenerSucursalId(request.actor.usuarioId);
        if (sucursalId === null) {
            return Result.fail(new OperadorSinSucursalError());
        }

        // 2. Control de turno de caja:
        // En mostrador (no B2B), quien tiene facturacion:abrir-turno (cajero / admin en mostrador) EXIGE turno abierto.
        // En venta B2B (esB2B === true), NO se exige turno de caja a ningún rol.
        const exigeTurno = !request.esB2B && (request.actor.permisos?.includes('facturacion:abrir-turno') ?? false);
        let turnoCajaId: string | null = null;
        const turnoAbierto = await this.turnoRepository.buscarAbiertoDeUsuario(request.actor.usuarioId);

        if (exigeTurno && !turnoAbierto) {
            return Result.fail(new FacturacionSinTurnoAbiertoError());
        }
        if (turnoAbierto) {
            turnoCajaId = turnoAbierto.id;
        }

        // 3. Validación de cliente y reglas B2B / Crédito corporativo
        const cliente = await this.clienteRepository.findById(request.clienteId);
        if (!cliente) {
            return Result.fail(new ClienteNoEncontradoError());
        }

        if (request.esB2B && !cliente.esB2B) {
            return Result.fail(new ClienteRequeridoParaVentaB2BError());
        }

        const tienePagoCredito = request.pagos.some((p) => p.medioPago === 'credito_corporativo');
        if (tienePagoCredito && !cliente.puedePagarConCredito) {
            return Result.fail(new CreditoNoHabilitadoError());
        }

        // 4. Totales calculados en el dominio
        const { subtotal, iva, total } = Factura.calcularTotales(request.items);
        const sumaPagos = Math.round(request.pagos.reduce((acc, p) => acc + p.monto, 0) * 100) / 100;

        if (Math.abs(sumaPagos - total) > 0.01) {
            return Result.fail(
                new PagoInvalidoError(`La suma de los pagos ($${sumaPagos}) no coincide con el total de la factura ($${total}).`),
            );
        }

        // 5. Construcción de entidades para inserción atómica
        const facturaId = crypto.randomUUID();

        const itemsEntidades = request.items.map((i) =>
            FacturaItem.crear(
                crypto.randomUUID(),
                facturaId,
                i.productoId,
                i.cantidad,
                i.precioUnitario,
                i.descuento ?? 0,
            ),
        );

        const pagosEntidades = request.pagos.map(
            (p) =>
                new FacturaPago(
                    crypto.randomUUID(),
                    facturaId,
                    p.medioPago,
                    p.monto,
                    p.referenciaTransaccion ?? null,
                    new Date(),
                ),
        );

        const facturaEntidad = new Factura(
            facturaId,
            0, // El repositorio calcula y asigna el consecutivo atómicamente
            cliente.id,
            request.actor.usuarioId,
            sucursalId,
            turnoCajaId,
            subtotal,
            iva,
            total,
            'emitida',
            null,
            new Date(),
            itemsEntidades,
            pagosEntidades,
        );

        // 6. Transacción atómica en repositorio (los triggers validan stock y descuentan kardex)
        let facturaGuardada: Factura;
        try {
            facturaGuardada = await this.facturaRepository.crear({
                factura: facturaEntidad,
                items: itemsEntidades,
                pagos: pagosEntidades,
            });
        } catch (error) {
            if (
                error instanceof StockInsuficienteError ||
                error instanceof CreditoNoHabilitadoError ||
                error instanceof PagoInvalidoError
            ) {
                return Result.fail(error);
            }
            throw error;
        }

        // 7. Registro de auditoría
        await this.auditor.registrar({
            actor: request.actor,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES_AUDITORIA.FACTURAS,
            entidadId: facturaGuardada.id,
            detalles: {
                despues: {
                    consecutivo: facturaGuardada.consecutivo,
                    total: facturaGuardada.total,
                    subtotal: facturaGuardada.subtotal,
                    sucursalId: facturaGuardada.sucursalId,
                    clienteId: facturaGuardada.clienteId,
                    turnoCajaId: facturaGuardada.turnoCajaId,
                    itemsCount: facturaGuardada.items.length,
                },
            },
        });

        return Result.ok(facturaGuardada);
    }
}
