import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearActivoSchema,
  editarActivoSchema,
  darBajaActivoSchema,
  filtrosActivosSchema,
} from '../../../../../Shared/contracts/src/logistica/activo.schema';
import { filtrosMantenimientosSchema } from '../../../../../Shared/contracts/src/logistica/mantenimiento.schema';
import {
  ASSETS_SECTION_TABS,
  BRANCH_NAV_ITEMS,
  isBranchRouteActive,
} from '../config/branch-navigation.config';

describe('branch-assets — Navegación, esquemas y validaciones de Activos', () => {
  describe('Navegación: ASSETS_SECTION_TABS', () => {
    it('define las 3 pestañas requeridas del submódulo de activos', () => {
      assert.equal(ASSETS_SECTION_TABS.length, 3);
      assert.deepEqual(
        ASSETS_SECTION_TABS.map((t) => t.id),
        ['activos', 'mantenimientos', 'categorias'],
      );
      assert.deepEqual(
        ASSETS_SECTION_TABS.map((t) => t.href),
        [
          '/admin-sucursal/activos',
          '/admin-sucursal/activos/mantenimientos',
          '/admin-sucursal/activos/categorias',
        ],
      );
    });

    it('la pestaña "activos" exige coincidencia exacta para no quedar activa en subrutas', () => {
      const activosTab = ASSETS_SECTION_TABS.find((t) => t.id === 'activos')!;
      assert.equal(activosTab.exact, true);
      assert.equal(isBranchRouteActive('/admin-sucursal/activos', activosTab.href, activosTab.exact), true);
      assert.equal(isBranchRouteActive('/admin-sucursal/activos/mantenimientos', activosTab.href, activosTab.exact), false);
      assert.equal(isBranchRouteActive('/admin-sucursal/activos/categorias', activosTab.href, activosTab.exact), false);
    });

    it('la pestaña "mantenimientos" se activa en su ruta', () => {
      const mantTab = ASSETS_SECTION_TABS.find((t) => t.id === 'mantenimientos')!;
      assert.equal(isBranchRouteActive('/admin-sucursal/activos/mantenimientos', mantTab.href, mantTab.exact), true);
      assert.equal(isBranchRouteActive('/admin-sucursal/activos', mantTab.href, mantTab.exact), false);
    });

    it('el ítem Activos en el sidebar está en categoría OPERACIONES', () => {
      const navItem = BRANCH_NAV_ITEMS.find((i) => i.id === 'activos')!;
      assert.ok(navItem);
      assert.equal(navItem.categoria, 'OPERACIONES');
      assert.equal(navItem.href, '/admin-sucursal/activos');
      assert.equal(isBranchRouteActive('/admin-sucursal/activos/mantenimientos', navItem.href, navItem.exact), true);
    });
  });

  describe('Validación de contratos Zod: Activos', () => {
    it('crearActivoSchema valida correctamente un activo nuevo', () => {
      const input = {
        codigoActivo: 'ACT-0099',
        nombre: 'Caja Fuerte Blindada',
        categoriaActivoId: 2,
        sucursalId: 1,
        valorAdquisicion: 1500000,
        fechaAdquisicion: '2026-11-19',
        condicion: 'Excelente',
      };
      const res = crearActivoSchema.safeParse(input);
      assert.equal(res.success, true);
    });

    it('crearActivoSchema rechaza código vacío', () => {
      const input = {
        codigoActivo: '',
        nombre: 'Impresora',
        sucursalId: 1,
      };
      const res = crearActivoSchema.safeParse(input);
      assert.equal(res.success, false);
    });

    it('editarActivoSchema permite actualizar campos parciales', () => {
      const input = {
        nombre: 'Impresora Multifuncional HP',
        valorAdquisicion: 480000,
        condicion: 'Bueno',
      };
      const res = editarActivoSchema.safeParse(input);
      assert.equal(res.success, true);
    });

    it('darBajaActivoSchema exige motivo mínimo de 5 caracteres', () => {
      const inputValido = { motivo: 'Daño irreparable constatado por perito.' };
      assert.equal(darBajaActivoSchema.safeParse(inputValido).success, true);

      const inputCorto = { motivo: 'Fallo' };
      assert.equal(darBajaActivoSchema.safeParse(inputCorto).success, false);
    });

    it('filtrosActivosSchema aplica paginación por defecto y coerce números', () => {
      const query = {
        sucursalId: '1',
        busqueda: 'laptop',
        page: '2',
        limit: '15',
      };
      const res = filtrosActivosSchema.safeParse(query);
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.sucursalId, 1);
        assert.equal(res.data.page, 2);
        assert.equal(res.data.limit, 15);
      }
    });

    it('filtrosMantenimientosSchema valida estado y tipos permitidos', () => {
      const query = {
        tipo: 'preventivo',
        estado: 'en_curso',
        page: '1',
      };
      const res = filtrosMantenimientosSchema.safeParse(query);
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.tipo, 'preventivo');
        assert.equal(res.data.estado, 'en_curso');
      }
    });
  });
});
