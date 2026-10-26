/**
 * branch-inventory.interface.ts — Contrato del servicio de inventario para sede.
 * 
 * Principio SOLID: Dependency Inversion Principle (DIP).
 */

import type {
  ProductoInventarioSede,
  FiltrosInventarioSede,
  CategoriaInventario,
  CrearCategoriaDTO,
  ProveedorInventario,
  ActualizarProductoDTO,
  CrearProveedorDTO,
  RegistrarEntradaDTO,
  RegistrarSalidaDTO,
  AjustarInventarioDTO,
  FiltrosKardexDTO,
  ResultadoKardexPaginado,
  ResultadoEntradasPaginado,
} from '../types/branch-inventory.types';

export interface IBranchInventoryService {
  listarInventarioSede(
    sucursalId: number,
    filtros?: FiltrosInventarioSede,
  ): Promise<{
    items: ProductoInventarioSede[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  editarProducto(productoId: string, data: ActualizarProductoDTO, sucursalId?: number): Promise<void>;
  cambiarEstadoProducto(productoId: string, isActive: boolean): Promise<void>;
  configurarStockMinimo(productoId: string, sucursalId: number, stockMinimo: number): Promise<void>;
  listarCategorias(): Promise<CategoriaInventario[]>;
  crearCategoria(data: CrearCategoriaDTO | string): Promise<CategoriaInventario>;
  listarProveedores(filtros?: { busqueda?: string; isActive?: boolean }): Promise<ProveedorInventario[]>;
  crearProveedor(data: CrearProveedorDTO): Promise<ProveedorInventario>;
  editarProveedor(id: number, data: { nombre?: string; contacto?: string; isActive?: boolean }): Promise<void>;
  cambiarEstadoProveedor(id: number, isActive: boolean): Promise<void>;

  // Fase 2: Movimientos de inventario, ajustes y kardex
  registrarEntrada(dto: RegistrarEntradaDTO): Promise<{ id?: string; mensaje?: string }>;
  registrarSalida(dto: RegistrarSalidaDTO): Promise<{ mensaje?: string }>;
  ajustarInventario(dto: AjustarInventarioDTO): Promise<{
    mensaje?: string;
    ajusteRealizado: boolean;
    diferencia: number;
    tipoAjuste: string;
    stockPrevio?: number;
    stockFisico?: number;
  }>;
  consultarKardex(filtros: FiltrosKardexDTO): Promise<ResultadoKardexPaginado>;
  listarEntradas(filtros?: {
    sucursalId?: number;
    proveedorId?: number;
    productoId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ResultadoEntradasPaginado>;
  anularEntrada(id: string, motivo: string): Promise<{ mensaje: string }>;
  descargarKardexCsv(filtros?: {
    productoId?: string;
    sucursalId?: number;
    tipo?: string;
    desde?: string;
    hasta?: string;
  }): Promise<Blob>;
}
