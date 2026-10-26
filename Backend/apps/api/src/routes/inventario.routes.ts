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
  consultarHistorialPreciosController,
  importarProductosController,
  exportarProductosCsvController,
} from '../controllers/inventario/producto.controller.ts';
import {
  ajustarInventarioController,
  anularEntradaController,
  consultarKardexController,
  exportarKardexCsvController,
  listarEntradasController,
  obtenerEntradaPorIdController,
  registrarEntradaController,
  registrarSalidaController,
  transferirMercanciaController,
} from '../controllers/inventario/movimiento-inventario.controller.ts';
import {
  configurarStockMinimoController,
  consultarStockSucursalController,
  listarStockSucursalController,
} from '../controllers/inventario/stock-minimo.controller.ts';

import { PERMISSIONS } from '@warengine/contracts';

// Códigos según la tabla `permisos` (seed).
// Si los nuevos permisos ya existen dentro del objeto PERMISOS de @warengine/contratos:
const PERMISO_INVENTARIO_LEER = PERMISSIONS.INVENTARIO_LEER;
const PERMISO_INVENTARIO_ESCRIBIR = PERMISSIONS.INVENTARIO_ESCRIBIR;
const PERMISO_INVENTARIO_REGISTRAR_MOVIMIENTO = PERMISSIONS.INVENTARIO_REGISTRAR_MOVIMIENTO;
const PERMISO_INVENTARIO_VER_KARDEX = PERMISSIONS.INVENTARIO_VER_KARDEX;
const PERMISO_INVENTARIO_AJUSTAR_STOCK = PERMISSIONS.INVENTARIO_AJUSTAR_STOCK;

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
  api.post(
    '/productos/importar-csv',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    importarProductosController(container),
  );
  api.get(
    '/productos/exportar-csv',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    exportarProductosCsvController(container),
  );
  api.get(
    '/productos/:id',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    obtenerProductoPorIdController(container),
  );
  api.get(
    '/productos/:id/historial-precios',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    consultarHistorialPreciosController(container),
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

  // ─── Movimientos de Inventario (RF-ADM-B7, RF-ADM-B8, RF-ADM-B9, RF-ADM-B15) ─
  api.get(
    '/entradas',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    listarEntradasController(container),
  );
  api.get(
    '/entradas/:id',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    obtenerEntradaPorIdController(container),
  );
  api.post(
    '/entradas',
    authMiddleware(container, PERMISO_INVENTARIO_REGISTRAR_MOVIMIENTO),
    registrarEntradaController(container),
  );
  api.post(
    '/entradas/:id/anular',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    anularEntradaController(container),
  );
  api.post(
    '/salidas',
    authMiddleware(container, PERMISO_INVENTARIO_REGISTRAR_MOVIMIENTO),
    registrarSalidaController(container),
  );
  api.post(
    '/ajustes',
    authMiddleware(container, PERMISO_INVENTARIO_AJUSTAR_STOCK),
    ajustarInventarioController(container),
  );
  api.post(
    '/transferencias',
    authMiddleware(container, PERMISO_INVENTARIO_REGISTRAR_MOVIMIENTO),
    transferirMercanciaController(container),
  );
  api.get(
    '/kardex',
    authMiddleware(container, PERMISO_INVENTARIO_VER_KARDEX),
    consultarKardexController(container),
  );
  api.get(
    '/kardex/exportar-csv',
    authMiddleware(container, PERMISO_INVENTARIO_VER_KARDEX),
    exportarKardexCsvController(container),
  );

  // ─── Configuración de Stock Mínimo (RF-ADM-B11) ───────────────────────────
  api.put(
    '/stock-minimo',
    authMiddleware(container, PERMISO_INVENTARIO_ESCRIBIR),
    configurarStockMinimoController(container),
  );
  // Existencias de toda una sede para vender (POS / B2B)
  api.get(
    '/stock',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    listarStockSucursalController(container),
  );
  api.get(
    '/stock-minimo/:sucursalId/:productoId',
    authMiddleware(container, PERMISO_INVENTARIO_LEER),
    consultarStockSucursalController(container),
  );

  return api;
}
