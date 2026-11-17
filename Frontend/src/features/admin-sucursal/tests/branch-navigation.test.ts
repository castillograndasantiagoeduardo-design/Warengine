import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BRANCH_NAV_CATEGORIES,
  BRANCH_NAV_ITEMS,
  INVENTORY_SECTION_TABS,
  ENABLE_GLOBAL_SEARCH,
  isBranchRouteActive,
} from '../config/branch-navigation.config.ts';

describe('branch-navigation.config — Navegación de Admin de Sucursal', () => {
  it('define las 3 categorías oficiales del sidebar en orden', () => {
    assert.deepEqual(BRANCH_NAV_CATEGORIES, ['MENÚ', 'OPERACIONES', 'SISTEMA']);
  });

  it('define los 8 ítems del sidebar con rutas reales bajo /admin-sucursal', () => {
    assert.equal(BRANCH_NAV_ITEMS.length, 8);
    const hrefs = BRANCH_NAV_ITEMS.map((item) => item.href);
    assert.deepEqual(hrefs, [
      '/admin-sucursal',
      '/admin-sucursal/facturacion',
      '/admin-sucursal/inventario',
      '/admin-sucursal/clientes',
      '/admin-sucursal/personal',
      '/admin-sucursal/activos',
      '/admin-sucursal/reportes',
      '/admin-sucursal/configuracion',
    ]);
  });

  it('marca Dashboard como activo únicamente en la ruta exacta /admin-sucursal', () => {
    const dashboardItem = BRANCH_NAV_ITEMS.find((i) => i.id === 'resumen')!;
    assert.equal(
      isBranchRouteActive('/admin-sucursal', dashboardItem.href, dashboardItem.exact),
      true,
    );
    assert.equal(
      isBranchRouteActive('/admin-sucursal/', dashboardItem.href, dashboardItem.exact),
      true,
    );
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario',
        dashboardItem.href,
        dashboardItem.exact,
      ),
      false,
    );
  });

  it('mantiene el ítem Inventario del sidebar activo en todas sus subrutas (Productos, Movimientos, Proveedores)', () => {
    const inventarioItem = BRANCH_NAV_ITEMS.find((i) => i.id === 'inventario')!;
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario',
        inventarioItem.href,
        inventarioItem.exact,
      ),
      true,
    );
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario/movimientos',
        inventarioItem.href,
        inventarioItem.exact,
      ),
      true,
    );
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario/proveedores',
        inventarioItem.href,
        inventarioItem.exact,
      ),
      true,
    );
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/facturacion',
        inventarioItem.href,
        inventarioItem.exact,
      ),
      false,
    );
  });

  it('evalúa correctamente la pestaña activa en SectionTabs de Inventario', () => {
    const [tabProductos, tabMovimientos, tabProveedores] = INVENTORY_SECTION_TABS;

    // En /admin-sucursal/inventario solo "Productos" está activa
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario',
        tabProductos.href,
        Boolean(tabProductos.exact),
      ),
      true,
    );
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario',
        tabMovimientos.href,
        Boolean(tabMovimientos.exact),
      ),
      false,
    );

    // En /admin-sucursal/inventario/movimientos solo "Movimientos" está activa
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario/movimientos',
        tabProductos.href,
        Boolean(tabProductos.exact),
      ),
      false,
    );
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario/movimientos',
        tabMovimientos.href,
        Boolean(tabMovimientos.exact),
      ),
      true,
    );

    // En /admin-sucursal/inventario/proveedores solo "Proveedores" está activa
    assert.equal(
      isBranchRouteActive(
        '/admin-sucursal/inventario/proveedores',
        tabProveedores.href,
        Boolean(tabProveedores.exact),
      ),
      true,
    );
  });

  it('mantiene ENABLE_GLOBAL_SEARCH desactivado en Fase 0', () => {
    assert.equal(ENABLE_GLOBAL_SEARCH, false);
  });
});
