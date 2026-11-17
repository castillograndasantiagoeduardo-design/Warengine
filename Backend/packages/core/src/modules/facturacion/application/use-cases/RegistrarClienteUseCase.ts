import { DomainError, Result } from '@warengine/shared-kernel';
import type { EvaluacionCreditoB2BDto, PlazoCreditoDias } from '@warengine/contracts';
import { Cliente, TipoCliente, TipoDocumentoCliente } from '../../domain/entities/Cliente.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { DatosClienteB2BIncompletosError } from '../../domain/errors/FacturacionErrors.ts';
import { EvaluadorCreditoB2B } from '../../domain/services/EvaluadorCreditoB2B.ts';
import { IAlertaAdminRepository } from '../../../administracion/domain/repositories/IAlertaAdminRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface RegistrarClienteRequest {
    tipoDocumento: TipoDocumentoCliente;
    numeroDocumento: string;
    nombreRazonSocial: string;
    tipoCliente: TipoCliente;
    email?: string;
    telefono?: string;
    direccion?: string;
    solicitarCredito?: boolean;
    gananciaNetaMensual?: number;
    antiguedadEmpresaMeses?: number;
    plazoCreditoDias?: PlazoCreditoDias;
    observacionFinanciera?: string;
    actor: ActorAuditoria;
}

export interface RegistrarClienteResultado {
    cliente: Cliente;
    /** true si ya existía un cliente con ese documento y se reutilizó (RF-FMC-D2 / D10). */
    yaExistia: boolean;
    /** Resultado del cálculo preliminar de crédito cuando es un cliente B2B que solicitó estudio. */
    evaluacionCredito?: EvaluacionCreditoB2BDto | null;
    /** true si se emitió la alerta de advertencia al Super Admin para aprobar el crédito. */
    alertaSuperAdminEnviada?: boolean;
}

export type RegistrarClienteResponse = Result<RegistrarClienteResultado, DomainError>;

export class RegistrarClienteUseCase {
    constructor(
        private readonly clienteRepository: IClienteRepository,
        private readonly auditor: IAuditor,
        private readonly alertaAdminRepository?: IAlertaAdminRepository,
        private readonly sucursalOperadorRepository?: ISucursalOperadorRepository,
        private readonly topeCreditoPolitica: number = EvaluadorCreditoB2B.TOPE_POLITICA_DEFAULT,
    ) { }

    public async execute(request: RegistrarClienteRequest): Promise<RegistrarClienteResponse> {
        const numeroDocumento = request.numeroDocumento.trim();

        // RF-FMC-D10: no duplicar clientes. RF-FMC-D2: si ya existe, se reutiliza.
        const existente = await this.clienteRepository.findByDocumento(
            request.tipoDocumento,
            numeroDocumento,
        );
        if (existente) {
            return Result.ok({ cliente: existente, yaExistia: true });
        }

        // RF-FMC-B5: el CHECK de la BD deja pasar cadenas vacías, así que se valida aquí también.
        const direccion = request.direccion?.trim() || null;
        const telefono = request.telefono?.trim() || null;
        if (request.tipoCliente === 'B2B' && (!direccion || !telefono)) {
            return Result.fail(new DatosClienteB2BIncompletosError());
        }

        // Evaluación crediticia preliminar para empresas B2B cuando envían ganancia neta / solicitan crédito
        const evaluaCredito =
            request.tipoCliente === 'B2B' &&
            (Boolean(request.solicitarCredito) ||
                (request.gananciaNetaMensual !== undefined && request.gananciaNetaMensual > 0));

        let evaluacionCredito: EvaluacionCreditoB2BDto | null = null;
        if (evaluaCredito && request.gananciaNetaMensual !== undefined && request.gananciaNetaMensual > 0) {
            evaluacionCredito = EvaluadorCreditoB2B.evaluar({
                gananciaNetaMensual: request.gananciaNetaMensual,
                antiguedadEmpresaMeses: request.antiguedadEmpresaMeses ?? null,
                plazoCreditoDias: request.plazoCreditoDias ?? 30,
                topePoliticaMaximo: this.topeCreditoPolitica,
            });
        }

        const cliente = await this.clienteRepository.crear({
            tipoDocumento: request.tipoDocumento,
            numeroDocumento,
            nombreRazonSocial: request.nombreRazonSocial.trim(),
            tipoCliente: request.tipoCliente,
            email: request.email?.trim() || null,
            telefono,
            direccion,
            gananciaNetaMensual: evaluacionCredito ? evaluacionCredito.gananciaNetaMensual : null,
            antiguedadEmpresaMeses: evaluacionCredito ? evaluacionCredito.antiguedadEmpresaMeses : null,
            plazoCreditoDias: evaluacionCredito ? evaluacionCredito.plazoCreditoDias : 30,
            cupoCreditoSugerido: evaluacionCredito ? evaluacionCredito.cupoSugerido : 0,
            nivelRiesgoCredito: evaluacionCredito ? evaluacionCredito.nivelRiesgo : null,
            // El crédito NUNCA se habilita solo: queda pendiente hasta aprobación explícita del Super Admin.
            estadoCredito: evaluacionCredito ? 'pendiente_aprobacion' : 'sin_solicitud',
            observacionFinanciera: request.observacionFinanciera?.trim() || null,
        });

        let alertaSuperAdminEnviada = false;
        if (evaluacionCredito && this.alertaAdminRepository) {
            const sucursalOperador = this.sucursalOperadorRepository
                ? await this.sucursalOperadorRepository.obtenerSucursalId(request.actor.usuarioId)
                : null;
            const sucursalId = sucursalOperador ?? 1;

            const marcadorCliente = ` [clienteId:${cliente.id}]`;
            const cuerpoDescripcion = [
                `ADVERTENCIA DE CRÉDITO B2B — Nueva empresa registrada: ${cliente.nombreRazonSocial}.`,
                `Ganancia neta mensual declarada: $${evaluacionCredito.gananciaNetaMensual.toLocaleString('es-CO')} COP.`,
                `Cupo sugerido por reglas de negocio: $${evaluacionCredito.cupoSugerido.toLocaleString('es-CO')} COP (Riesgo: ${evaluacionCredito.nivelRiesgo.toUpperCase()}, Plazo: ${evaluacionCredito.plazoCreditoDias} días).`,
                `El crédito permanece BLOQUEADO hasta que el Super Admin lo apruebe o rechace.`,
            ].join(' ');
            const descripcion = `${cuerpoDescripcion.slice(0, 500 - marcadorCliente.length)}${marcadorCliente}`;

            await this.alertaAdminRepository.crear({
                usuarioId: request.actor.usuarioId,
                sucursalId,
                motivo: 'SOLICITUD_CREDITO_B2B',
                prioridad: 'urgente',
                descripcion,
                destinatarioRol: 'super-admin',
            });
            alertaSuperAdminEnviada = true;
        }

        await this.auditor.registrar({
            actor: request.actor,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES_AUDITORIA.CLIENTES,
            entidadId: cliente.id,
            detalles: {
                despues: {
                    tipoDocumento: cliente.tipoDocumento,
                    nombreRazonSocial: cliente.nombreRazonSocial,
                    tipoCliente: cliente.tipoCliente,
                    email: cliente.email,
                    telefono: cliente.telefono,
                    direccion: cliente.direccion,
                    ...(evaluacionCredito
                        ? {
                            estadoCredito: cliente.estadoCredito,
                            cupoCreditoSugerido: cliente.cupoCreditoSugerido,
                            nivelRiesgoCredito: cliente.nivelRiesgoCredito,
                        }
                        : {}),
                },
            },
        });

        return Result.ok({
            cliente,
            yaExistia: false,
            evaluacionCredito,
            alertaSuperAdminEnviada,
        });
    }
}