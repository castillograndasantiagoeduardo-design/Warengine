import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularTiempoTranscurrido } from '../components/staff/ActiveShiftCard';
import {
  cierreAdministrativoTurnoSchema,
  historialTurnosQuerySchema,
} from '../../../../../Shared/contracts/src/facturacion/turno-caja.schema';
import { listarEmpleadosQuerySchema } from '../../../../../Shared/contracts/src/administracion/empleado.schema';
import {
  STAFF_SECTION_TABS,
  BRANCH_NAV_ITEMS,
  isBranchRouteActive,
} from '../config/branch-navigation.config';

describe('branch-staff — Funciones puras, schemas y navegación de Personal', () => {
  describe('calcularTiempoTranscurrido', () => {
    it('retorna "—" si la fecha es inválida o no se proporciona', () => {
      assert.equal(calcularTiempoTranscurrido(''), '—');
      // @ts-expect-error test con null
      assert.equal(calcularTiempoTranscurrido(null), '—');
    });

    it('retorna "< 1m" si la diferencia es inferior a 60 segundos', () => {
      const ahora = new Date();
      assert.equal(calcularTiempoTranscurrido(ahora.toISOString()), '< 1m');
    });

    it('calcula correctamente minutos transcurridos (< 1 hora)', () => {
      const hace25m = new Date(Date.now() - 25 * 60 * 1000);
      assert.equal(calcularTiempoTranscurrido(hace25m.toISOString()), '25m');
    });

    it('calcula correctamente horas y minutos transcurridos', () => {
      const hace3h25m = new Date(Date.now() - (3 * 3600 + 25 * 60) * 1000);
      assert.equal(calcularTiempoTranscurrido(hace3h25m.toISOString()), '3h 25m');
    });
  });

  describe('validaciones de contrato: cierreAdministrativoTurnoSchema', () => {
    it('acepta un cierre administrativo con motivo válido y fondoFinal', () => {
      const input = {
        motivo: 'Cajero ausente por emergencia médica verificada.',
        fondoFinal: 250000,
      };
      const result = cierreAdministrativoTurnoSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.fondoFinal, 250000);
      }
    });

    it('acepta un cierre administrativo sin fondoFinal (sin arqueo físico)', () => {
      const input = {
        motivo: 'Cierre forzado por falla de terminal sin conteo de caja.',
      };
      const result = cierreAdministrativoTurnoSchema.safeParse(input);
      assert.equal(result.success, true);
    });

    it('rechaza motivo menor a 5 caracteres', () => {
      const input = {
        motivo: 'Fin',
      };
      const result = cierreAdministrativoTurnoSchema.safeParse(input);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.path.includes('motivo')));
      }
    });

    it('rechaza fondoFinal negativo', () => {
      const input = {
        motivo: 'Cierre con valor inválido reportado',
        fondoFinal: -5000,
      };
      const result = cierreAdministrativoTurnoSchema.safeParse(input);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.path.includes('fondoFinal')));
      }
    });
  });

  describe('validaciones de contrato: historialTurnosQuerySchema', () => {
    it('parsea correctamente tipos de cierre y banderas booleanas', () => {
      const input = {
        page: '2',
        limite: '15',
        tipoCierre: 'administrativo',
        conDiferencia: 'true',
      };
      const result = historialTurnosQuerySchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.limite, 15);
        assert.equal(result.data.tipoCierre, 'administrativo');
        assert.equal(result.data.conDiferencia, true);
      }
    });

    it('rechaza tipoCierre no soportado', () => {
      const input = {
        tipoCierre: 'desconocido',
      };
      const result = historialTurnosQuerySchema.safeParse(input);
      assert.equal(result.success, false);
    });
  });

  describe('validaciones de contrato: listarEmpleadosQuerySchema', () => {
    it('parsea búsqueda, cargo, paginación y estado', () => {
      const input = {
        q: 'Carlos',
        cargo: 'Cajero',
        page: '1',
        limite: '20',
        isActive: 'true',
      };
      const result = listarEmpleadosQuerySchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.q, 'Carlos');
        assert.equal(result.data.cargo, 'Cajero');
        assert.equal(result.data.page, 1);
        assert.equal(result.data.isActive, true);
      }
    });
  });

  describe('navegación de Personal y pestañas', () => {
    it('define las 3 pestañas oficiales de Personal', () => {
      assert.equal(STAFF_SECTION_TABS.length, 3);
      assert.deepEqual(
        STAFF_SECTION_TABS.map((t) => t.id),
        ['empleados', 'turnos', 'historial'],
      );
      assert.deepEqual(
        STAFF_SECTION_TABS.map((t) => t.href),
        [
          '/admin-sucursal/personal',
          '/admin-sucursal/personal/turnos',
          '/admin-sucursal/personal/historial',
        ],
      );
    });

    it('mantiene el ítem Personal del sidebar activo en todas las subrutas', () => {
      const staffItem = BRANCH_NAV_ITEMS.find((i) => i.id === 'personal')!;
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal', staffItem.href, staffItem.exact),
        true,
      );
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal/turnos', staffItem.href, staffItem.exact),
        true,
      );
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal/historial', staffItem.href, staffItem.exact),
        true,
      );
    });

    it('evalúa la pestaña activa de Personal con exactitud', () => {
      const [tabEmpleados, tabTurnos, tabHistorial] = STAFF_SECTION_TABS;

      // En /admin-sucursal/personal solo 'empleados' está activa
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal', tabEmpleados.href, Boolean(tabEmpleados.exact)),
        true,
      );
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal', tabTurnos.href, Boolean(tabTurnos.exact)),
        false,
      );

      // En /admin-sucursal/personal/turnos solo 'turnos' está activa
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal/turnos', tabEmpleados.href, Boolean(tabEmpleados.exact)),
        false,
      );
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal/turnos', tabTurnos.href, Boolean(tabTurnos.exact)),
        true,
      );

      // En /admin-sucursal/personal/historial solo 'historial' está activa
      assert.equal(
        isBranchRouteActive('/admin-sucursal/personal/historial', tabHistorial.href, Boolean(tabHistorial.exact)),
        true,
      );
    });
  });
});
