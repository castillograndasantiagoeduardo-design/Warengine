/**
 * branch-inventory.interface.ts — Contrato del servicio de inventario para sede.
 * 
 * Principio SOLID: Dependency Inversion Principle (DIP).
 */

import type {
  ProductoInventarioSede,
  FiltrosInventarioSede,
  CategoriaInventario,
  ProveedorInventario,
  ActualizarProductoDTO,
  CrearProveedorDTO,
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
  listarProveedores(filtros?: { busqueda?: string; isActive?: boolean }): Promise<ProveedorInventario[]>;
  crearProveedor(data: CrearProveedorDTO): Promise<ProveedorInventario>;
  editarProveedor(id: number, data: { nombre?: string; contacto?: string; isActive?: boolean }): Promise<void>;
  cambiarEstadoProveedor(id: number, isActive: boolean): Promise<void>;
}
