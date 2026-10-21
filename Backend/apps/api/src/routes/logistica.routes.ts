import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import {
  listarCategoriasActivosController,
  crearCategoriaActivoController,
  editarCategoriaActivoController,
  cambiarEstadoCategoriaActivoController,
} from '../controllers/logistica/categoria-activo.controller.ts';
import {
  crearActivoController,
  listarActivosController,
  consultarActivoController,
  darBajaActivoController,
} from '../controllers/logistica/activo.controller.ts';
import {
  asignarActivoEmpleadoController,
  asignarActivoAreaController,
  devolverActivoController,
  consultarHistorialAsignacionesController,
} from '../controllers/logistica/asignacion.controller.ts';
import {
  registrarMantenimientoController,
  finalizarMantenimientoController,
  consultarHistorialMantenimientosController,
} from '../controllers/logistica/mantenimiento.controller.ts';

const PERMISO_LEER = 'logistica:leer';
const PERMISO_GESTIONAR = 'logistica:gestionar-activos';
const PERMISO_ASIGNAR = 'logistica:asignar-activos';
const PERMISO_MANTENIMIENTO = 'logistica:mantenimiento';

export function createLogisticaRoutes(container: AppContainer): Hono {
  const api = new Hono();

  // Categorias de Activos (RF-LOG-A1)
  api.get('/categorias-activos', authMiddleware(container, PERMISO_LEER), listarCategoriasActivosController(container));
  api.post('/categorias-activos', authMiddleware(container, PERMISO_GESTIONAR), crearCategoriaActivoController(container));
  api.put('/categorias-activos/:id', authMiddleware(container, PERMISO_GESTIONAR), editarCategoriaActivoController(container));
  api.put('/categorias-activos/:id/estado', authMiddleware(container, PERMISO_GESTIONAR), cambiarEstadoCategoriaActivoController(container));

  // Activos (RF-LOG-A2, A3, A4, A5)
  api.get('/activos', authMiddleware(container, PERMISO_LEER), listarActivosController(container));
  api.post('/activos', authMiddleware(container, PERMISO_GESTIONAR), crearActivoController(container));
  api.get('/activos/:id', authMiddleware(container, PERMISO_LEER), consultarActivoController(container));
  api.put('/activos/:id/baja', authMiddleware(container, PERMISO_GESTIONAR), darBajaActivoController(container));

  // Asignaciones (RF-LOG-B1, B2, B3, B4, B5)
  api.post('/activos/:id/asignar-empleado', authMiddleware(container, PERMISO_ASIGNAR), asignarActivoEmpleadoController(container));
  api.post('/activos/:id/asignar-area', authMiddleware(container, PERMISO_ASIGNAR), asignarActivoAreaController(container));
  api.put('/activos/:id/devolver', authMiddleware(container, PERMISO_ASIGNAR), devolverActivoController(container));
  api.get('/activos/:id/asignaciones', authMiddleware(container, PERMISO_LEER), consultarHistorialAsignacionesController(container));

  // Mantenimientos (RF-LOG-C1, C2, C3)
  api.post('/activos/:id/mantenimientos', authMiddleware(container, PERMISO_MANTENIMIENTO), registrarMantenimientoController(container));
  api.get('/activos/:id/mantenimientos', authMiddleware(container, PERMISO_LEER), consultarHistorialMantenimientosController(container));
  api.put('/mantenimientos/:id/finalizar', authMiddleware(container, PERMISO_MANTENIMIENTO), finalizarMantenimientoController(container));

  return api;
}
