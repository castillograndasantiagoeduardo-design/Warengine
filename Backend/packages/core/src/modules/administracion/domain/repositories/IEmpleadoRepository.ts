/**
 * IEmpleadoRepository.ts
 *
 * Puerto (Port) de repositorio para la consulta y actualización de empleados.
 *
 * Rol en la arquitectura:
 * - Capa de Dominio (Puertos de Repositorio).
 * - Permite al caso de uso de edición de empleados interactuar con la base de datos
 *   de forma agnóstica a la tecnología subyacente.
 *
 * Requisito SRS:
 * - RF-ADM-C12: Edición independiente de datos de empleados.
 * - RF-ADM-C5: Listado y filtrado de personal.
 */

import { Empleado } from '../entities/Empleado.ts';

export interface FiltrosEmpleados {
  sucursalId?: number;
  areaId?: number;
  isActive?: boolean;
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
  findById(id: string): Promise<Empleado | null>;
  actualizarDatos(id: string, data: ActualizarEmpleadoData): Promise<Empleado>;
}
