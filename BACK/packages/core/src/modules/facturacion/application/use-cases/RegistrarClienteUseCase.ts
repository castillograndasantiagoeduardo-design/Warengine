import { DomainError, Result } from '@warengine/shared-kernel';
import { Cliente, TipoCliente, TipoDocumentoCliente } from '../../domain/entities/Cliente.ts';
import { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import { DatosClienteB2BIncompletosError } from '../../domain/errors/FacturacionErrors.ts';

export interface RegistrarClienteRequest {
    tipoDocumento: TipoDocumentoCliente;
    numeroDocumento: string;
    nombreRazonSocial: string;
    tipoCliente: TipoCliente;
    email?: string;
    telefono?: string;
    direccion?: string;
}

export interface RegistrarClienteResultado {
    cliente: Cliente;
    /** true si ya existía un cliente con ese documento y se reutilizó (RF-FMC-D2 / D10). */
    yaExistia: boolean;
}

export type RegistrarClienteResponse = Result<RegistrarClienteResultado, DomainError>;

export class RegistrarClienteUseCase {
    constructor(private readonly clienteRepository: IClienteRepository) { }

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

        const cliente = await this.clienteRepository.crear({
            tipoDocumento: request.tipoDocumento,
            numeroDocumento,
            nombreRazonSocial: request.nombreRazonSocial.trim(),
            tipoCliente: request.tipoCliente,
            email: request.email?.trim() || null,
            telefono,
            direccion,
        });
        return Result.ok({ cliente, yaExistia: false });
    }
}