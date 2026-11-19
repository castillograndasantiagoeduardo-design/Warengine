import { Empleado } from '../entities/Empleado.ts';

export interface FiltrosEmpleados {
  sucursalId?: number;
  /** Acota a estas sedes (alcance del usuario, RNF-ADM-04). */
  sucursalIds?: number[];
  areaId?: number;
  isActive?: boolean;
  busqueda?: string;
  cargo?: string;
  page?: number;
  limite?: number;
}

export interface EmpleadosPaginadosResultado {
  items: Empleado[];
  total: number;
  totalPaginas: number;
  page: number;
  limite: number;
}

export interface ActualizarEmpleadoData {
  nombre?: string;
  telefono?: string | null;
  direccion?: string | null;
  cargo?: string | null;
  areaId?: number | null;
  isActive?: boolean;
}

export interface IEmpleadoRepository {
  listar(filtros?: FiltrosEmpleados): Promise<Empleado[]>;
  listarPaginado?(filtros: FiltrosEmpleados): Promise<EmpleadosPaginadosResultado>;
  findById(id: string): Promise<Empleado | null>;
  actualizarDatos(id: string, data: ActualizarEmpleadoData): Promise<Empleado>;
}
