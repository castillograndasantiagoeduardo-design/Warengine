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
} from '../controllers/administracion/usuario.controller.ts';

// Códigos tal como están en la tabla `permisos` (seed). Solo super-admin los tiene.
const PERMISO_SUCURSALES = 'administracion:gestionar-sucursales';
const PERMISO_USUARIOS = 'autenticacion:gestionar-usuarios';
const PERMISO_ROLES = 'autenticacion:asignar-roles';

export function createAdministracionRoutes(container: AppContainer): Hono {
  const api = new Hono();

  // Sucursales (RF-ADM-C1, C2, C3)
  api.get('/sucursales', authMiddleware(container, PERMISO_SUCURSALES), listarSucursalesController(container));
  api.post('/sucursales', authMiddleware(container, PERMISO_SUCURSALES), crearSucursalController(container));
  api.put('/sucursales/:id', authMiddleware(container, PERMISO_SUCURSALES), editarSucursalController(container));

  // Usuarios (RF-ADM-C5, C6, C7, C8)
  api.get('/usuarios', authMiddleware(container, PERMISO_USUARIOS), listarUsuariosController(container));
  api.post('/usuarios', authMiddleware(container, PERMISO_USUARIOS), crearUsuarioController(container));
  api.put('/usuarios/:id/rol', authMiddleware(container, PERMISO_ROLES), cambiarRolUsuarioController(container));
  api.put('/usuarios/:id/estado', authMiddleware(container, PERMISO_USUARIOS), cambiarEstadoUsuarioController(container));

  return api;
}