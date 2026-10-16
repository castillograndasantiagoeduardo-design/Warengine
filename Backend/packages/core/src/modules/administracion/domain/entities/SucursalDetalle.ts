export interface UsuarioAsignadoSucursal {
  id: string;
  email: string;
  nombre: string;
  cargo: string | null;
  rolId: number;
  rolNombre: string;
  isActive: boolean;
  esSedePrincipal: boolean;
}

export interface VentaRecienteSucursal {
  id: string;
  consecutivo: number;
  fecha: Date;
  total: number;
  estado: string;
  clienteNombre: string | null;
  clienteDocumento: string | null;
}

export interface EstadisticasSucursal {
  totalUsuariosAsignados: number;
  productosConStock: number;
  totalUnidadesStock: number;
  totalVentas: number;
  montoTotalVentas: number;
}

export class SucursalDetalle {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly direccion: string | null,
    public readonly contacto: string | null,
    public readonly isActive: boolean,
    public readonly usuariosAsignados: UsuarioAsignadoSucursal[],
    public readonly estadisticas: EstadisticasSucursal,
    public readonly ventasRecientes: VentaRecienteSucursal[],
  ) {}
}
