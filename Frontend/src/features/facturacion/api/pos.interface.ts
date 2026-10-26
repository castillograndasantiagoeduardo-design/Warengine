/**
 * pos.interface.ts — Contrato de la API para la terminal de Punto de Venta (POS).
 *
 * Principio SOLID:
 * - Dependency Inversion Principle (DIP): Los componentes y hooks consumen esta interfaz
 *   desacoplados del transporte HTTP específico.
 */

import type {
  TurnoCajaDto,
  FacturaDto,
  ItemFacturaInput,
  PagoFacturaInput,
  ClienteDto,
  CrearClienteInput,
  ProductoPos,
} from '../types/pos.types';

export interface EmitirFacturaInput {
  clienteId: string;
  items: ItemFacturaInput[];
  pagos: PagoFacturaInput[];
  esB2B?: boolean;
}

export interface EnviarAlertaAdminInput {
  sucursalId: number;
  tipo: string;
  mensaje: string;
  prioridad?: 'normal' | 'urgente';
}

export interface IPosService {
  /**
   * Consulta si el cajero autenticado tiene un turno de caja abierto actualmente.
   */
  obtenerTurnoActual(): Promise<TurnoCajaDto | null>;

  /**
   * Abre un nuevo turno de caja con el fondo inicial declarado.
   */
  abrirTurno(fondoInicial: number): Promise<TurnoCajaDto>;

  /**
   * Cierra el turno de caja activo realizando el arqueo con el fondo final.
   */
  cerrarTurno(turnoId: string, fondoFinal: number): Promise<TurnoCajaDto>;

  /**
   * Busca productos en el catálogo maestro y su stock para la sucursal actual.
   */
  buscarProductos(query: string | undefined, sucursalId: number): Promise<ProductoPos[]>;

  /**
   * Busca clientes en el directorio (por documento, nombre o email).
   */
  buscarClientes(texto?: string): Promise<ClienteDto[]>;

  /**
   * Registra un nuevo cliente (o devuelve el existente si ya estaba registrado).
   */
  crearCliente(input: CrearClienteInput): Promise<{ cliente: ClienteDto; yaExistia: boolean }>;

  /**
   * Emite una factura de mostrador o B2B con validación transaccional de pagos.
   */
  emitirFactura(input: EmitirFacturaInput): Promise<FacturaDto>;

  /**
   * Lista facturas emitidas por la sucursal en el turno o período.
   */
  listarFacturas(params?: { sucursalId?: number; fechaInicio?: string; limite?: number }): Promise<FacturaDto[]>;

  /**
   * Obtiene el detalle completo de una factura por su ID.
   */
  obtenerFacturaPorId(id: string): Promise<FacturaDto>;

  /**
   * Emite una alerta operativa directa al Administrador de Sucursal.
   */
  enviarAlertaAdmin(input: EnviarAlertaAdminInput): Promise<void>;
}
