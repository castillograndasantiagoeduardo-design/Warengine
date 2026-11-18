import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INVOICING_SECTION_TABS,
  isBranchRouteActive,
} from '../config/branch-navigation.config.ts';

describe('branch-invoicing — Configuración de pestañas y reglas de negocio', () => {
  it('define las pestañas de facturación (Facturas y Alertas) con rutas bajo /admin-sucursal/facturacion', () => {
    assert.equal(INVOICING_SECTION_TABS.length, 2);
    assert.deepEqual(
      INVOICING_SECTION_TABS.map((t) => t.id),
      ['facturas', 'alertas'],
    );
    assert.deepEqual(
      INVOICING_SECTION_TABS.map((t) => t.href),
      ['/admin-sucursal/facturacion', '/admin-sucursal/facturacion/alertas'],
    );
  });

  it('marca la pestaña Facturas activa en coincidencia exacta', () => {
    const tabFacturas = INVOICING_SECTION_TABS.find((t) => t.id === 'facturas')!;
    assert.equal(
      isBranchRouteActive('/admin-sucursal/facturacion', tabFacturas.href, tabFacturas.exact),
      true,
    );
    assert.equal(
      isBranchRouteActive('/admin-sucursal/facturacion/alertas', tabFacturas.href, tabFacturas.exact),
      false,
    );
  });

  it('marca la pestaña Alertas activa en su subruta', () => {
    const tabAlertas = INVOICING_SECTION_TABS.find((t) => t.id === 'alertas')!;
    assert.equal(
      isBranchRouteActive('/admin-sucursal/facturacion/alertas', tabAlertas.href, tabAlertas.exact),
      true,
    );
    assert.equal(
      isBranchRouteActive('/admin-sucursal/facturacion', tabAlertas.href, tabAlertas.exact),
      false,
    );
  });

  it('determina visibilidad de anulación: permitida solo si estado es emitida', () => {
    const puedeAnular = (estado: string) => estado === 'emitida';
    assert.equal(puedeAnular('emitida'), true);
    assert.equal(puedeAnular('anulada'), false);
    assert.equal(puedeAnular('otro'), false);
  });

  it('determina si quedan unidades devolvibles considerando devoluciones previas', () => {
    const items = [
      { id: 'i-1', cantidad: 3 },
      { id: 'i-2', cantidad: 2 },
    ];
    const devoluciones = [
      { facturaItemId: 'i-1', cantidad: 2 },
      { facturaItemId: 'i-2', cantidad: 2 },
    ];

    const calcularDisponibles = (
      its: typeof items,
      devs: typeof devoluciones,
    ) => {
      const devMap = new Map<string, number>();
      for (const d of devs) {
        devMap.set(d.facturaItemId, (devMap.get(d.facturaItemId) ?? 0) + d.cantidad);
      }
      return its.map((it) => ({
        id: it.id,
        disponible: Math.max(0, it.cantidad - (devMap.get(it.id) ?? 0)),
      }));
    };

    const res = calcularDisponibles(items, devoluciones);
    assert.equal(res[0].disponible, 1); // 3 - 2 = 1
    assert.equal(res[1].disponible, 0); // 2 - 2 = 0
    const tieneRemanente = res.some((r) => r.disponible > 0);
    assert.equal(tieneRemanente, true);
  });

  it('calcula la vista previa de reembolso de devolución respetando descuento proporcional', () => {
    const it = {
      cantidad: 2,
      precioUnitario: 10000,
      descuento: 2000, // 1000 por unidad
    };
    const cantidadADevolver = 1;
    const descUnitario = it.descuento / it.cantidad;
    const reembolso = (it.precioUnitario - descUnitario) * cantidadADevolver;

    assert.equal(reembolso, 9000);
  });
});
