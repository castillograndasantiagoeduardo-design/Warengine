/**
 * branch-assets.interface.ts — Contrato del servicio de Activos de la Sucursal.
 *
 * Principio SOLID: Interface Segregation Principle (ISP) e Inversión de Dependencias (DIP).
 */

import type {
  ActivoSede,
  ActivosFiltros,
  ActivosResultadoPaginado,
  CrearActivoDTO,
  EditarActivoDTO,
  DarBajaActivoDTO,
  AsignarActivoEmpleadoDTO,
  AsignarActivoAreaDTO,
  DevolverActivoDTO,
  MantenimientoSede,
  MantenimientosFiltros,
  MantenimientosResultadoPaginado,
  RegistrarMantenimientoDTO,
  FinalizarMantenimientoDTO,
  CategoriaActivoSede,
  CategoriasActivosFiltros,
  CategoriasActivosResultadoPaginado,
  CrearCategoriaActivoDTO,
  EditarCategoriaActivoDTO,
} from '../types/branch-assets.types';

export interface IBranchAssetsService {
  listarActivos(sucursalId: number, filtros?: ActivosFiltros): Promise<ActivosResultadoPaginado>;
  obtenerActivo(id: string): Promise<ActivoSede>;
  crearActivo(datos: CrearActivoDTO): Promise<ActivoSede>;
  editarActivo(id: string, datos: EditarActivoDTO): Promise<ActivoSede>;
  darBajaActivo(id: string, datos: DarBajaActivoDTO): Promise<ActivoSede>;
  asignarEmpleado(id: string, datos: AsignarActivoEmpleadoDTO): Promise<any>;
  asignarArea(id: string, datos: AsignarActivoAreaDTO): Promise<any>;
  devolverActivo(id: string, datos?: DevolverActivoDTO): Promise<any>;

  listarMantenimientos(sucursalId: number, filtros?: MantenimientosFiltros): Promise<MantenimientosResultadoPaginado>;
  registrarMantenimiento(activoId: string, datos: RegistrarMantenimientoDTO): Promise<any>;
  finalizarMantenimiento(id: string, datos: FinalizarMantenimientoDTO): Promise<any>;

  listarCategorias(filtros?: CategoriasActivosFiltros): Promise<CategoriasActivosResultadoPaginado>;
  crearCategoria(datos: CrearCategoriaActivoDTO): Promise<CategoriaActivoSede>;
  editarCategoria(id: number, datos: EditarCategoriaActivoDTO): Promise<CategoriaActivoSede>;
  cambiarEstadoCategoria(id: number, isActive: boolean): Promise<CategoriaActivoSede>;
}
