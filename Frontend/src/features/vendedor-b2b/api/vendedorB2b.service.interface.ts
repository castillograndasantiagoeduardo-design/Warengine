import type {
  ClienteDto,
  CrearClienteInput,
  FacturaDto,
  ProductoCatalogoB2B,
  CrearOrdenB2BPayload,
} from '../types';

export interface IVendedorB2bService {
  obtenerProductos(
    sucursalId: number,
    params?: { texto?: string; categoriaId?: number },
  ): Promise<ProductoCatalogoB2B[]>;
  obtenerCategorias(): Promise<Array<{ id: number; nombre: string }>>;
  buscarClientes(texto?: string): Promise<ClienteDto[]>;
  crearCliente(cliente: CrearClienteInput): Promise<ClienteDto>;
  crearFacturaB2B(payload: CrearOrdenB2BPayload): Promise<FacturaDto>;
  listarFacturasB2B(limite?: number): Promise<FacturaDto[]>;
}
