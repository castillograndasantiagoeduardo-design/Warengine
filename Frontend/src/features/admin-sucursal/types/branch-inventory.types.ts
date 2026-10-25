/**
 * branch-inventory.types.ts — Tipos de dominio para la gestión de inventario y stock de sede.
 * 
 * Principio SOLID: Interface Segregation Principle (ISP).
 * Define contratos desacoplados para productos en sede, filtros de búsqueda,
 * categorías, proveedores y configuración de umbrales de stock mínimo.
 */

export interface SucursalStockInfo {
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  estadoStock: 'optimo' | 'bajo' | 'critico' | 'agotado';
}

export interface ProductoInventarioSede {
  id: string;
  sku: string;
  nombre: string;
  categoriaId: number | null;
  categoriaNombre?: string;
  proveedorId?: number | null;
  proveedorNombre?: string;
  precioCompra: number;
  precioVenta: number;
  precioCorporativo?: number | null;
  isActive: boolean;
  stockActual: number;
  stockMinimo: number;
  estadoStock: 'optimo' | 'bajo' | 'critico' | 'agotado';
  margenGananciaPorcentaje: number;
}

export interface FiltrosInventarioSede {
  texto?: string;
  categoriaId?: number;
  proveedorId?: number;
  nivelStock?: 'todos' | 'optimo' | 'bajo' | 'agotado';
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CategoriaInventario {
  id: number;
  nombre: string;
  isActive: boolean;
}

export interface ProveedorInventario {
  id: number;
  nombre: string;
  contacto?: string | null;
  isActive: boolean;
}

export interface ActualizarProductoDTO {
  sku?: string;
  nombre?: string;
  categoriaId?: number | null;
  proveedorId?: number | null;
  precioCompra?: number;
  precioVenta?: number;
  precioCorporativo?: number | null;
  isActive?: boolean;
  stockMinimoSede?: number;
}

export interface CrearProveedorDTO {
  nombre: string;
  contacto?: string;
}
