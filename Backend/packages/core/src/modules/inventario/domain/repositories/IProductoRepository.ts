import type { ResultadoPaginado } from '@warengine/shared-kernel';
import { Producto } from '../entities/Producto.ts';

export interface DatosCrearProducto {
  id?: string;
  sku: string;
  nombre: string;
  categoriaId?: number | null;
  proveedorId?: number | null;
  precioCompra: number;
  precioVenta: number;
  precioCorporativo?: number | null;
  stockInicial?: number;
  stockMinimo?: number;
  sucursalId?: number;
  usuarioId?: string;
}

export interface DatosActualizarProducto {
  sku?: string;
  nombre?: string;
  categoriaId?: number | null;
  proveedorId?: number | null;
  precioCompra?: number;
  precioVenta?: number;
  precioCorporativo?: number | null;
  isActive?: boolean;
}

export interface ResumenStockSede {
  total: number;
  optimo: number;
  bajo: number;
  agotado: number;
}

export interface ResultadoProductosPaginado extends ResultadoPaginado<Producto> {
  resumen?: ResumenStockSede;
  contadores?: ResumenStockSede;
}

export interface FiltrosListarProductos {
  texto?: string;
  categoriaId?: number;
  proveedorId?: number;
  isActive?: boolean;
  stockBajo?: boolean;
  sinCategoria?: boolean;
  nivelStock?: 'optimo' | 'bajo' | 'agotado' | 'todos';
  estado?: 'activo' | 'inactivo' | 'todos';
  sucursalId?: number;
  page: number;
  limit: number;
}

export interface IProductoRepository {
  findById(id: string): Promise<Producto | null>;
  findBySku(sku: string): Promise<Producto | null>;
  listar(filtros: FiltrosListarProductos): Promise<ResultadoProductosPaginado>;
  crear(datos: DatosCrearProducto): Promise<Producto>;
  actualizar(id: string, cambios: DatosActualizarProducto): Promise<Producto>;
  cambiarEstado(id: string, isActive: boolean): Promise<Producto>;
  tieneMovimientos(id: string): Promise<boolean>;
  contarActivosPorCategoria(categoriaId: number): Promise<number>;
  contarActivosPorProveedor(proveedorId: number): Promise<number>;
}
