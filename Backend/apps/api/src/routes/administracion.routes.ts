import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import {
  crearSucursalController,
  editarSucursalController,
  listarSucursalesController,
} from '../controllers/administracion/sucursal.controller.ts';
import {
  cambiarEstadoUsuarioController,
  cambiarRolUsuarioController,
  crearUsuarioController,
  listarUsuariosController,
  restablecerPasswordUsuarioController,

} from '../controllers/administracion/usuario.controller.ts';

import { consultarAuditoriaController } from '../controllers/administracion/auditoria.controller.ts';
import { consultarAlertasStockController } from '../controllers/administracion/alerta-stock.controller.ts';
  // Usuarios (RF-ADM-C5, C6, C7, C8, C9, C10)
import {
  asignarSucursalesUsuarioController,
  obtenerSucursalesUsuarioController,
} from '../controllers/administracion/usuario-sucursal.controller.ts';

import {
  crearAreaController,
  editarAreaController,
  eliminarAreaController,
  listarAreasPorSucursalController,
} from '../controllers/administracion/area.controller.ts';
import {
  editarEmpleadoController,
  listarEmpleadosController,
  obtenerEmpleadoPorIdController,
} from '../controllers/administracion/empleado.controller.ts';

// Códigos tal como están en la tabla `permisos` (seed).
const PERMISO_SUCURSALES = 'administracion:gestionar-sucursales';
const PERMISO_PERSONAL = 'administracion:gestionar-personal';
const PERMISO_USUARIOS = 'autenticacion:gestionar-usuarios';
const PERMISO_ROLES = 'autenticacion:asignar-roles';
const PERMISO_AUDITORIA = 'autenticacion:ver-auditoria';
const PERMISO_ALERTAS = 'administracion:gestionar-alertas';

export function createAdministracionRoutes(container: AppContainer): Hono {
  const api = new Hono();

  // Sucursales (RF-ADM-C1, C2, C3)
  api.get('/sucursales', authMiddleware(container, PERMISO_SUCURSALES), listarSucursalesController(container));
  api.post('/sucursales', authMiddleware(container, PERMISO_SUCURSALES), crearSucursalController(container));
  api.put('/sucursales/:id', authMiddleware(container, PERMISO_SUCURSALES), editarSucursalController(container));

  // Áreas por Sucursal (RF-ADM-C4)
  api.get('/sucursales/:id/areas', authMiddleware(container, PERMISO_SUCURSALES), listarAreasPorSucursalController(container));
  api.post('/sucursales/:id/areas', authMiddleware(container, PERMISO_SUCURSALES), crearAreaController(container));
  api.put('/areas/:id', authMiddleware(container, PERMISO_SUCURSALES), editarAreaController(container));
  api.delete('/areas/:id', authMiddleware(container, PERMISO_SUCURSALES), eliminarAreaController(container));

  // Empleados (RF-ADM-C5, C12)
  api.get('/empleados', authMiddleware(container, PERMISO_PERSONAL), listarEmpleadosController(container));
  api.get('/empleados/:id', authMiddleware(container, PERMISO_PERSONAL), obtenerEmpleadoPorIdController(container));
  api.put('/empleados/:id', authMiddleware(container, PERMISO_PERSONAL), editarEmpleadoController(container));

  // Usuarios (RF-ADM-C5, C6, C7, C8, C9)
  api.get('/usuarios', authMiddleware(container, PERMISO_USUARIOS), listarUsuariosController(container));
  api.post('/usuarios', authMiddleware(container, PERMISO_USUARIOS), crearUsuarioController(container));
  api.put('/usuarios/:id/rol', authMiddleware(container, PERMISO_ROLES), cambiarRolUsuarioController(container));
  api.put('/usuarios/:id/estado', authMiddleware(container, PERMISO_USUARIOS), cambiarEstadoUsuarioController(container));
  api.put('/usuarios/:id/password', authMiddleware(container, PERMISO_USUARIOS), restablecerPasswordUsuarioController(container));
  api.get('/usuarios/:id/sucursales', authMiddleware(container, PERMISO_USUARIOS), obtenerSucursalesUsuarioController(container));
  api.put('/usuarios/:id/sucursales', authMiddleware(container, PERMISO_USUARIOS), asignarSucursalesUsuarioController(container));

  // Auditoría
  api.get('/auditoria', authMiddleware(container, PERMISO_AUDITORIA), consultarAuditoriaController(container));
  api.get('/alertas-stock', authMiddleware(container, PERMISO_ALERTAS), consultarAlertasStockController(container));

  return api;
}