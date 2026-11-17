import type {
  ClienteDto,
  CotizacionB2BDto,
  CrearClienteInput,
  CrearClienteResultadoDto,
  CrearCotizacionB2BInput,
  EvaluacionCreditoB2BDto,
  FacturaDto,
  FacturarCotizacionResultadoDto,
  MedioPago,
  ProductoCatalogoB2B,
  SimularCreditoB2BInput,
} from '../types';

export interface IVendedorB2bService {
  obtenerProductos(
    sucursalId: number,
    params?: { texto?: string; categoriaId?: number },
  ): Promise<ProductoCatalogoB2B[]>;
  obtenerCategorias(): Promise<Array<{ id: number; nombre: string }>>;
  buscarClientes(texto?: string): Promise<ClienteDto[]>;
  crearCliente(cliente: CrearClienteInput): Promise<CrearClienteResultadoDto>;
  simularCreditoB2B(payload: SimularCreditoB2BInput): Promise<EvaluacionCreditoB2BDto>;
  crearCotizacionB2B(payload: CrearCotizacionB2BInput): Promise<CotizacionB2BDto>;
  listarCotizacionesB2B(): Promise<CotizacionB2BDto[]>;
  facturarCotizacionB2B(
    cotizacionId: string,
    payload?: { medioPago?: MedioPago; referenciaTransaccion?: string | null },
  ): Promise<FacturarCotizacionResultadoDto>;
  listarFacturasB2B(limite?: number): Promise<FacturaDto[]>;
}
