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

export interface FiltrosKardex {
  productoId?: string;
  sucursalId?: number;
  sucursalIds?: number[];
  proveedorId?: number;
  tipo?: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida';
  desde?: Date;
  hasta?: Date;
  limit: number;
  offset: number;
}

export interface ItemKardex {
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
  fecha: Date;
}

export interface ResultadoKardex {
  items: ItemKardex[];
  total: number;
  limit: number;
  offset: number;
}

export interface DatosAnulacionEntrada {
  motivo: string;
  usuarioId: string;
}

export interface DatosRegistroAjuste {
  productoId: string;
  sucursalId: number;
  tipo: 'ajuste_entrada' | 'ajuste_salida';
  cantidad: number;
  motivo: string;
  usuarioId: string;
}

export interface IMovimientoInventarioRepository {
  obtenerStockActual(productoId: string, sucursalId: number): Promise<number>;
  registrarEntrada(datos: DatosRegistroEntrada): Promise<MovimientoInventario>;
  registrarSalida(datos: DatosRegistroSalida): Promise<MovimientoInventario>;
  registrarAjuste(datos: DatosRegistroAjuste): Promise<MovimientoInventario>;
  consultarKardex(filtros: FiltrosKardex): Promise<{ items: ItemKardex[]; total: number }>;
  obtenerPorId(id: string): Promise<ItemKardex | null>;
  estaEntradaAnulada(entradaId: string): Promise<boolean>;
  anularEntrada(entradaId: string, datos: DatosAnulacionEntrada): Promise<MovimientoInventario>;
}
