import { Hono } from 'hono';
import { AppContainer } from '@warengine/composition';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import {
  cambiarEstadoCategoriaController,
  crearCategoriaController,
  editarCategoriaController,
  listarCategoriasController,
  obtenerCategoriaPorIdController,
} from '../controllers/inventario/categoria.controller.ts';
import {
  cambiarEstadoProveedorController,
  crearProveedorController,
  editarProveedorController,
  listarProveedoresController,
  obtenerProveedorPorIdController,
} from '../controllers/inventario/proveedor.controller.ts';
import {
  cambiarEstadoProductoController,
  crearProductoController,
  editarProductoController,
  listarProductosController,
  obtenerProductoPorIdController,
} from '../controllers/inventario/producto.controller.ts';

// Códigos según la tabla `permisos` (seed).
// `inventario:leer`: super-admin, admin-sucursal, cajero-vendedor
// `inventario:escribir`: super-admin, admin-sucursal (cajero-vendedor recibe 403)
const PERMISO_INVENTARIO_LEER = 'inventario:leer';
const PERMISO_INVENTARIO_ESCRIBIR = 'inventario:escribir';

export function createInventarioRoutes(container: AppContainer): Hono {
  const api = new Hono();

  // ─── Categorías de Producto (RF-ADM-B5) ───────────────────────────────────
  api.get(
    '/categorias',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    listarCategoriasController(container),
  );
  api.get(
    '/categorias/:id',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    obtenerCategoriaPorIdController(container),
  );
  api.post(
    '/categorias',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    crearCategoriaController(container),
  );
  api.put(
    '/categorias/:id',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    editarCategoriaController(container),
  );
  api.put(
    '/categorias/:id/estado',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    cambiarEstadoCategoriaController(container),
  );

  // ─── Proveedores (RF-ADM-B6) ──────────────────────────────────────────────
  api.get(
    '/proveedores',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    listarProveedoresController(container),
  );
  api.get(
    '/proveedores/:id',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    obtenerProveedorPorIdController(container),
  );
  api.post(
    '/proveedores',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    crearProveedorController(container),
  );
  api.put(
    '/proveedores/:id',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    editarProveedorController(container),
  );
  api.put(
    '/proveedores/:id/estado',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    cambiarEstadoProveedorController(container),
  );

  // ─── Productos (RF-ADM-B1, B2, B3, B4) ────────────────────────────────────
  api.get(
    '/productos',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    listarProductosController(container),
  );
  api.get(
    '/productos/:id',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    obtenerProductoPorIdController(container),
  );
  api.post(
    '/productos',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    crearProductoController(container),
  );
  api.put(
    '/productos/:id',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    editarProductoController(container),
  );
  api.put(
    '/productos/:id/estado',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    cambiarEstadoProductoController(container),
  );

  return api;
}
