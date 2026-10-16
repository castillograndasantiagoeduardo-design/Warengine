import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import {
  cambiarEstadoSucursalController,
  crearSucursalController,
  editarSucursalController,
  listarSucursalesController,
  obtenerDetalleSucursalController,
} from '../controllers/administracion/sucursal.controller.ts';
import {
  cambiarEstadoUsuarioController,
  cambiarRolUsuarioController,
  crearUsuarioController,
  listarUsuariosController,
  restablecerPasswordUsuarioController,

} from '../controllers/administracion/usuario.controller.ts';

import {
  consultarAuditoriaController,
  exportarAuditoriaCsvController,
} from '../controllers/administracion/auditoria.controller.ts';
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
import {
  consultarHistorialSalariosController,
  registrarAumentoSalarioController,
} from '../controllers/administracion/historial-salario.controller.ts';
import {
  cambiarEstadoAlertaAdminController,
  crearAlertaAdminController,
  listarAlertasAdminController,
} from '../controllers/administracion/alerta-admin.controller.ts';

import {
  consultarComparativoInventarioController,
  consultarMetricasGananciasController,
  consultarRankingProductosController,
  consultarRendimientoSucursalesController,
  consultarTendenciasVentasController,
} from '../controllers/administracion/dashboard.controller.ts';

// Códigos tal como están en la tabla `permisos` (seed).
const PERMISO_SUCURSALES = 'administracion:gestionar-sucursales';
const PERMISO_PERSONAL = 'administracion:gestionar-personal';
const PERMISO_USUARIOS = 'autenticacion:gestionar-usuarios';
const PERMISO_ROLES = 'autenticacion:asignar-roles';
const PERMISO_AUDITORIA = 'autenticacion:ver-auditoria';
const PERMISO_ALERTAS = 'administracion:gestionar-alertas';
const PERMISO_SALARIOS = 'administracion:gestionar-salarios';
const PERMISO_METRICAS = 'administracion:ver-metricas-sucursal';

export function createAdministracionRoutes(container: AppContainer): Hono {
  const api = new Hono();

  // Sucursales (RF-ADM-C1, C2, C3, C17, C18)
  api.get('/sucursales', authMiddleware(container, PERMISO_SUCURSALES), listarSucursalesController(container));
  api.get('/sucursales/:id/detalle', authMiddleware(container, PERMISO_SUCURSALES), obtenerDetalleSucursalController(container));
  api.post('/sucursales', authMiddleware(container, PERMISO_SUCURSALES), crearSucursalController(container));
  api.put('/sucursales/:id', authMiddleware(container, PERMISO_SUCURSALES), editarSucursalController(container));
  api.put('/sucursales/:id/estado', authMiddleware(container, PERMISO_SUCURSALES), cambiarEstadoSucursalController(container));

  // Áreas por Sucursal (RF-ADM-C4)
  api.get('/sucursales/:id/areas', authMiddleware(container, PERMISO_SUCURSALES), listarAreasPorSucursalController(container));
  api.post('/sucursales/:id/areas', authMiddleware(container, PERMISO_SUCURSALES), crearAreaController(container));
  api.put('/areas/:id', authMiddleware(container, PERMISO_SUCURSALES), editarAreaController(container));
  api.delete('/areas/:id', authMiddleware(container, PERMISO_SUCURSALES), eliminarAreaController(container));

  // Empleados (RF-ADM-C5, C12, C14)
  api.get('/empleados', authMiddleware(container, PERMISO_PERSONAL), listarEmpleadosController(container));
  api.get('/empleados/:id', authMiddleware(container, PERMISO_PERSONAL), obtenerEmpleadoPorIdController(container));
  api.put('/empleados/:id', authMiddleware(container, PERMISO_PERSONAL), editarEmpleadoController(container));
  api.get('/empleados/:id/salarios', authMiddleware(container, PERMISO_SALARIOS), consultarHistorialSalariosController(container));
  api.post('/empleados/:id/salarios', authMiddleware(container, PERMISO_SALARIOS), registrarAumentoSalarioController(container));

  // Usuarios (RF-ADM-C5, C6, C7, C8, C9)
  api.get('/usuarios', authMiddleware(container, PERMISO_USUARIOS), listarUsuariosController(container));
  api.post('/usuarios', authMiddleware(container, PERMISO_USUARIOS), crearUsuarioController(container));
  api.put('/usuarios/:id/rol', authMiddleware(container, PERMISO_ROLES), cambiarRolUsuarioController(container));
  api.put('/usuarios/:id/estado', authMiddleware(container, PERMISO_USUARIOS), cambiarEstadoUsuarioController(container));
  api.put('/usuarios/:id/password', authMiddleware(container, PERMISO_USUARIOS), restablecerPasswordUsuarioController(container));
  api.get('/usuarios/:id/sucursales', authMiddleware(container, PERMISO_USUARIOS), obtenerSucursalesUsuarioController(container));
  api.put('/usuarios/:id/sucursales', authMiddleware(container, PERMISO_USUARIOS), asignarSucursalesUsuarioController(container));

  // Auditoría (RF-ADM-C11, RF-ADM-C20) y Alertas
  api.get('/auditoria/exportar', authMiddleware(container, PERMISO_AUDITORIA), exportarAuditoriaCsvController(container));
  api.get('/auditoria', authMiddleware(container, PERMISO_AUDITORIA), consultarAuditoriaController(container));
  api.get('/alertas-stock', authMiddleware(container, PERMISO_ALERTAS), consultarAlertasStockController(container));
  api.get('/alertas', authMiddleware(container, PERMISO_ALERTAS), listarAlertasAdminController(container));
  api.post('/alertas', authMiddleware(container, PERMISO_ALERTAS), crearAlertaAdminController(container));
  api.put('/alertas/:id/estado', authMiddleware(container, PERMISO_ALERTAS), cambiarEstadoAlertaAdminController(container));

  // Dashboard y Analítica (RF-ADM-A1, RF-ADM-A2, RF-ADM-A3, RF-ADM-A4, RF-ADM-C4, RNF-ADM-01, RNF-ADM-03, RNF-ADM-04)
  api.get('/dashboard/metricas', authMiddleware(container, PERMISO_METRICAS), consultarMetricasGananciasController(container));
  api.get('/dashboard/tendencias', authMiddleware(container, PERMISO_METRICAS), consultarTendenciasVentasController(container));
  api.get('/dashboard/rendimiento', authMiddleware(container, PERMISO_METRICAS), consultarRendimientoSucursalesController(container));
  api.get('/dashboard/ranking', authMiddleware(container, PERMISO_METRICAS), consultarRankingProductosController(container));
  api.get('/dashboard/inventario', authMiddleware(container, PERMISO_METRICAS), consultarComparativoInventarioController(container));

  return api;
}