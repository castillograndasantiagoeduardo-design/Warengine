import type {
  ClienteDto,
  CrearClienteInput,
  FacturaDto,
  ProductoResponse,
  CrearOrdenB2BPayload,
} from '../types';

export interface IVendedorB2bService {
  obtenerProductos(params?: { texto?: string; categoriaId?: number }): Promise<ProductoResponse[]>;
  obtenerCategorias(): Promise<Array<{ id: number; nombre: string }>>;
  buscarClientes(texto?: string): Promise<ClienteDto[]>;
  crearCliente(cliente: CrearClienteInput): Promise<ClienteDto>;
  crearFacturaB2B(payload: CrearOrdenB2BPayload): Promise<FacturaDto>;
  listarFacturasB2B(limite?: number): Promise<FacturaDto[]>;
}
