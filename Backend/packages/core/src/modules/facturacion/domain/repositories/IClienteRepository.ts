import { Cliente, TipoCliente, TipoDocumentoCliente } from '../entities/Cliente.ts';

export interface DatosCliente {
    tipoDocumento: TipoDocumentoCliente;
    numeroDocumento: string;
    nombreRazonSocial: string;
    tipoCliente: TipoCliente;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
}

export interface FiltrosClientes {
    texto?: string;
    tipoDocumento?: TipoDocumentoCliente;
    limite: number;
}

export interface FiltrosClientesPaginado {
    texto?: string;
    tipoDocumento?: TipoDocumentoCliente;
    tipoCliente?: TipoCliente;
    creditoHabilitado?: boolean;
    estado?: 'activo' | 'inactivo';
    page: number;
    limite: number;
    offset: number;
}

export interface ResumenClientesResultado {
    total: number;
    b2b: number;
    b2c: number;
    conCredito: number;
    saldoPendienteTotal: number;
}

export interface ClientesPaginadosResultado {
    items: Cliente[];
    total: number;
    totalPaginas: number;
    page: number;
    limite: number;
    resumen: ResumenClientesResultado;
}

export interface DatosActualizarCliente {
    nombreRazonSocial?: string;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    creditoHabilitado?: boolean;
}

export interface IClienteRepository {
    buscar(filtros: FiltrosClientes): Promise<Cliente[]>;
    buscarPaginado?(filtros: FiltrosClientesPaginado): Promise<ClientesPaginadosResultado>;
    findByDocumento(tipo: TipoDocumentoCliente, numero: string): Promise<Cliente | null>;
    findById(id: string): Promise<Cliente | null>;
    crear(datos: DatosCliente): Promise<Cliente>;
    actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente>;
}