export interface DatosRegistroEntrada {
  productoId: string;
  sucursalId: number;
  cantidad: number;
  proveedorId?: number | null;
  motivo?: string | null;
  usuarioId: string;
}

export interface DatosRegistroSalida {
  productoId: string;
  sucursalId: number;
  cantidad: number;
  motivo: string;
  usuarioId: string;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  sucursalId: number;
  tipo: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida';
  cantidad: number;
  motivo?: string | null;
  proveedorId?: number | null;
  facturaId?: string | null;
  devolucionId?: string | null;
  usuarioId: string;
  fecha: Date;
  stockResultante?: number;
}

export interface IMovimientoInventarioRepository {
  obtenerStockActual(productoId: string, sucursalId: number): Promise<number>;
  registrarEntrada(datos: DatosRegistroEntrada): Promise<MovimientoInventario>;
  registrarSalida(datos: DatosRegistroSalida): Promise<MovimientoInventario>;
}
