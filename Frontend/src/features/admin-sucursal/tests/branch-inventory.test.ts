import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INVENTORY_SECTION_TABS,
  isBranchRouteActive,
} from '../config/branch-navigation.config.ts';

describe('branch-inventory — Configuración de navegación y reglas de negocio', () => {
  it('define las 4 pestañas de inventario con rutas bajo /admin-sucursal/inventario', () => {
    assert.equal(INVENTORY_SECTION_TABS.length, 4);
    assert.deepEqual(
      INVENTORY_SECTION_TABS.map((t) => t.id),
      ['productos', 'movimientos', 'proveedores', 'categorias'],
    );
    assert.deepEqual(
      INVENTORY_SECTION_TABS.map((t) => t.href),
      [
        '/admin-sucursal/inventario',
        '/admin-sucursal/inventario/movimientos',
        '/admin-sucursal/inventario/proveedores',
        '/admin-sucursal/inventario/categorias',
      ],
    );
  });

  it('determina si una categoría puede ser inactivada (RF-ADM-B19)', () => {
    const puedeInactivarCategoria = (totalProductos?: number) => (totalProductos ?? 0) === 0;

    assert.equal(puedeInactivarCategoria(0), true);
    assert.equal(puedeInactivarCategoria(undefined), true);
    assert.equal(puedeInactivarCategoria(5), false);
    assert.equal(puedeInactivarCategoria(1), false);
  });

  it('calcula el estado del stock según umbrales de la sede', () => {
    const calcularNivelStock = (stockActual: number, stockMinimo: number) => {
      if (stockActual <= 0) return 'agotado';
      if (stockActual <= stockMinimo) return 'bajo';
      return 'optimo';
    };

    assert.equal(calcularNivelStock(0, 10), 'agotado');
    assert.equal(calcularNivelStock(-2, 10), 'agotado');
    assert.equal(calcularNivelStock(5, 10), 'bajo');
    assert.equal(calcularNivelStock(10, 10), 'bajo');
    assert.equal(calcularNivelStock(11, 10), 'optimo');
    assert.equal(calcularNivelStock(50, 10), 'optimo');
  });

  it('calcula el margen comercial estimado', () => {
    const calcularMargen = (precioVenta: number, precioCompra?: number | null) => {
      if (!precioCompra || precioCompra <= 0 || precioVenta <= 0) return null;
      return Number((((precioVenta - precioCompra) / precioVenta) * 100).toFixed(1));
    };

    // Venta 10000, Compra 7000 => margen 30%
    assert.equal(calcularMargen(10000, 7000), 30.0);
    // Venta 4200, Compra 3200 => margen 23.8%
    assert.equal(calcularMargen(4200, 3200), 23.8);
    // Sin precio de compra => null
    assert.equal(calcularMargen(4200, null), null);
    assert.equal(calcularMargen(4200, undefined), null);
  });

  it('valida longitud mínima requerida para motivo de anulación de entrada (RF-ADM-B16)', () => {
    const validarMotivoAnulacion = (motivo: string) => motivo.trim().length >= 5;

    assert.equal(validarMotivoAnulacion(''), false);
    assert.equal(validarMotivoAnulacion('1234'), false);
    assert.equal(validarMotivoAnulacion('12345'), true);
    assert.equal(validarMotivoAnulacion('Error de factura duplicada'), true);
  });

  it('calcula la discrepancia y tipo de ajuste en auditoría de conteo físico', () => {
    const calcularDiscrepancia = (stockSistema: number, conteoFisico: number) => {
      const diff = conteoFisico - stockSistema;
      let tipo: 'sin_cambio' | 'sobrante' | 'faltante' = 'sin_cambio';
      if (diff > 0) tipo = 'sobrante';
      if (diff < 0) tipo = 'faltante';
      return { diferencia: diff, tipo };
    };

    assert.deepEqual(calcularDiscrepancia(20, 25), { diferencia: 5, tipo: 'sobrante' });
    assert.deepEqual(calcularDiscrepancia(20, 15), { diferencia: -5, tipo: 'faltante' });
    assert.deepEqual(calcularDiscrepancia(20, 20), { diferencia: 0, tipo: 'sin_cambio' });
  });
});
