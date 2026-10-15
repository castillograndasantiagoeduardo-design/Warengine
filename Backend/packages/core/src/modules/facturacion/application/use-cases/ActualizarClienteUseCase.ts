import { DomainError, Result } from '@warengine/shared-kernel';
import { Cliente } from '../../domain/entities/Cliente.ts';
import {
    ClienteNoEncontradoError,
    DatosClienteB2BIncompletosError,
} from '../../domain/errors/FacturacionErrors.ts';
import { PermisoDenegadoError } from '../../../autenticacion/domain/errors/AutenticacionErrors.ts';
import {
    DatosActualizarCliente,
    IClienteRepository,
} from '../../domain/repositories/IClienteRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
    ACCIONES_AUDITORIA,
    ActorAuditoria,
    ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ActualizarClienteRequest {
    id: string;
    nombreRazonSocial?: string;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    creditoHabilitado?: boolean;
    actor: ActorAuditoria;
}

export type ActualizarClienteResponse = Result<Cliente, DomainError>;

export class ActualizarClienteUseCase {
    constructor(
        private readonly clienteRepository: IClienteRepository,
        private readonly auditor: IAuditor,
    ) { }

    public async execute(request: ActualizarClienteRequest): Promise<ActualizarClienteResponse> {
        const clienteExistente = await this.clienteRepository.findById(request.id);
        if (!clienteExistente) {
            return Result.fail(new ClienteNoEncontradoError());
        }

        // Regla: credito_habilitado solo editable por admin-sucursal/super-admin.
        // Validamos si el actor cuenta con permisos administrativos/escritura (inventario:escribir o administracion:reportes)
        if (
            request.creditoHabilitado !== undefined &&
            request.creditoHabilitado !== clienteExistente.creditoHabilitado
        ) {
            const tienePermisoAdmin =
                request.actor.permisos?.includes('inventario:escribir') ||
                request.actor.permisos?.includes('administracion:reportes') ||
                request.actor.permisos?.includes('autenticacion:gestionar-usuarios');

            if (!tienePermisoAdmin) {
                return Result.fail(
                    new PermisoDenegadoError('facturacion:gestionar-credito-cliente'),
                );
            }
        }

        // Si es B2B, no se puede dejar dirección o teléfono en vacío
        if (clienteExistente.esB2B) {
            const nuevaDireccion = request.direccion !== undefined ? request.direccion : clienteExistente.direccion;
            const nuevoTelefono = request.telefono !== undefined ? request.telefono : clienteExistente.telefono;
            if (!nuevaDireccion?.trim() || !nuevoTelefono?.trim()) {
                return Result.fail(new DatosClienteB2BIncompletosError());
            }
        }

        const datosAActualizar: DatosActualizarCliente = {};
        const antes: Record<string, unknown> = {};
        const despues: Record<string, unknown> = {};

        if (request.nombreRazonSocial !== undefined && request.nombreRazonSocial !== clienteExistente.nombreRazonSocial) {
            datosAActualizar.nombreRazonSocial = request.nombreRazonSocial;
            antes.nombreRazonSocial = clienteExistente.nombreRazonSocial;
            despues.nombreRazonSocial = request.nombreRazonSocial;
        }
        if (request.email !== undefined && request.email !== clienteExistente.email) {
            datosAActualizar.email = request.email;
            antes.email = clienteExistente.email;
            despues.email = request.email;
        }
        if (request.telefono !== undefined && request.telefono !== clienteExistente.telefono) {
            datosAActualizar.telefono = request.telefono;
            antes.telefono = clienteExistente.telefono;
            despues.telefono = request.telefono;
        }
        if (request.direccion !== undefined && request.direccion !== clienteExistente.direccion) {
            datosAActualizar.direccion = request.direccion;
            antes.direccion = clienteExistente.direccion;
            despues.direccion = request.direccion;
        }
        if (request.creditoHabilitado !== undefined && request.creditoHabilitado !== clienteExistente.creditoHabilitado) {
            datosAActualizar.creditoHabilitado = request.creditoHabilitado;
            antes.creditoHabilitado = clienteExistente.creditoHabilitado;
            despues.creditoHabilitado = request.creditoHabilitado;
        }

        const actualizado = await this.clienteRepository.actualizar(request.id, datosAActualizar);

        if (Object.keys(despues).length > 0) {
            await this.auditor.registrar({
                actor: request.actor,
                accion: ACCIONES_AUDITORIA.EDITAR,
                entidad: ENTIDADES_AUDITORIA.CLIENTES,
                entidadId: actualizado.id,
                detalles: { antes, despues },
            });
        }

        return Result.ok(actualizado);
    }
}
