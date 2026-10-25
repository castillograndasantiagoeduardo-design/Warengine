/**
 * empleados.service.ts — Personal y trayectoria salarial (RF-ADM-C12, C14).
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type {
  EditarEmpleadoInput,
  Empleado,
  FiltrosEmpleados,
  HistorialSalario,
  RegistrarAumentoSalarioInput,
} from '../types';

export interface IEmpleadosService {
  listar(filtros?: FiltrosEmpleados): Promise<Empleado[]>;
  obtener(id: string): Promise<Empleado>;
  editar(id: string, input: EditarEmpleadoInput): Promise<Empleado>;
  historialSalarios(id: string): Promise<HistorialSalario[]>;
  registrarAumento(id: string, input: RegistrarAumentoSalarioInput): Promise<HistorialSalario>;
}

const BASE = '/administracion/empleados';

export class EmpleadosService implements IEmpleadosService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public listar(filtros: FiltrosEmpleados = {}): Promise<Empleado[]> {
    return this.http.get<Empleado[]>(BASE, { params: { ...filtros } });
  }

  public obtener(id: string): Promise<Empleado> {
    return this.http.get<Empleado>(`${BASE}/${id}`);
  }

  public editar(id: string, input: EditarEmpleadoInput): Promise<Empleado> {
    return this.http.put<Empleado>(`${BASE}/${id}`, input);
  }

  public historialSalarios(id: string): Promise<HistorialSalario[]> {
    return this.http.get<HistorialSalario[]>(`${BASE}/${id}/salarios`);
  }

  public registrarAumento(id: string, input: RegistrarAumentoSalarioInput): Promise<HistorialSalario> {
    return this.http.post<HistorialSalario>(`${BASE}/${id}/salarios`, input);
  }
}

export const empleadosService = new EmpleadosService();
