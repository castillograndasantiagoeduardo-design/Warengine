import type { EstadoCreditoCliente, NivelRiesgoCredito } from '@warengine/contracts';
import { Cliente, TipoCliente, TipoDocumentoCliente } from '../entities/Cliente.ts';

export interface DatosCliente {
    tipoDocumento: TipoDocumentoCliente;
    numeroDocumento: string;
    nombreRazonSocial: string;
    tipoCliente: TipoCliente;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    gananciaNetaMensual?: number | null;
    antiguedadEmpresaMeses?: number | null;
    plazoCreditoDias?: number | null;
    cupoCreditoSugerido?: number;
    nivelRiesgoCredito?: NivelRiesgoCredito | null;
    estadoCredito?: EstadoCreditoCliente;
    observacionFinanciera?: string | null;
}

export interface FiltrosClientes {
    texto?: string;
    tipoDocumento?: TipoDocumentoCliente;
    limite: number;
}

export interface DatosActualizarCliente {
    nombreRazonSocial?: string;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    creditoHabilitado?: boolean;
}

export interface DatosDecisionCreditoCliente {
    creditoHabilitado: boolean;
    estadoCredito: EstadoCreditoCliente;
    cupoCreditoAprobado: number;
    plazoCreditoDias?: number | null;
    creditoAprobadoPor: string;
    creditoAprobadoEn: Date;
    motivoDecisionCredito: string | null;
}

export interface IClienteRepository {
    buscar(filtros: FiltrosClientes): Promise<Cliente[]>;
    findByDocumento(tipo: TipoDocumentoCliente, numero: string): Promise<Cliente | null>;
    findById(id: string): Promise<Cliente | null>;
    crear(datos: DatosCliente): Promise<Cliente>;
    actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente>;
    decidirCredito?(id: string, datos: DatosDecisionCreditoCliente): Promise<Cliente>;
    listarCreditosPendientes?(): Promise<Cliente[]>;
    registrarConsumoCredito?(id: string, monto: number): Promise<void>;
}