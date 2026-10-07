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

export interface IClienteRepository {
    buscar(filtros: FiltrosClientes): Promise<Cliente[]>;
    findByDocumento(tipo: TipoDocumentoCliente, numero: string): Promise<Cliente | null>;
    crear(datos: DatosCliente): Promise<Cliente>;
}