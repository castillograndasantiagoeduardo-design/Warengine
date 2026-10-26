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
  soloSinCategoria?: boolean;
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

export interface CrearCategoriaDTO {
  nombre: string;
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

// ─────────────────────────────────────────────────────────────────────────────
// FASE 2: Movimientos Operativos de Inventario (Entradas, Salidas, Ajustes, Kardex)
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistrarEntradaDTO {
  productoId: string;
  sucursalId: number;
  cantidad: number;
  proveedorId?: number | null;
  motivo?: string | null;
}

export interface RegistrarSalidaDTO {
  productoId: string;
  sucursalId: number;
  cantidad: number;
  motivo: string;
}

export interface AjustarInventarioDTO {
  productoId: string;
  sucursalId: number;
  stockFisico: number;
  motivo: string;
}

export interface MovimientoKardexItem {
  id: string;
  productoId: string;
  productoNombre?: string;
  productoSku?: string;
  sucursalId: number;
  sucursalNombre?: string;
  tipo: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida';
  cantidad: number;
  motivo?: string | null;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  facturaId?: string | null;
  devolucionId?: string | null;
  usuarioId: string;
  usuarioNombre?: string | null;
  fecha: string | Date;
  stockResultante?: number;
}

export interface ResultadoKardexPaginado {
  items: MovimientoKardexItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface FiltrosKardexDTO {
  productoId?: string;
  sucursalId?: number;
  tipo?: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida';
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
}

export interface EntradaMercanciaItem {
  id: string;
  productoId: string;
  productoNombre?: string;
  productoSku?: string;
  sucursalId: number;
  sucursalNombre?: string;
  tipo: 'entrada';
  cantidad: number;
  motivo?: string | null;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  usuarioId: string;
  usuarioNombre?: string | null;
  fecha: string | Date;
}

export interface ResultadoEntradasPaginado {
  items: EntradaMercanciaItem[];
  total: number;
  limit: number;
  offset: number;
}
