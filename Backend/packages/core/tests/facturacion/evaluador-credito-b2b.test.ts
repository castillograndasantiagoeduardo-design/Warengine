import { assertEquals } from 'jsr:@std/assert@^1';
import { EvaluadorCreditoB2B } from '../../src/modules/facturacion/domain/services/EvaluadorCreditoB2B.ts';

Deno.test('EvaluadorCreditoB2B: empresa consolidada (>=36m) con plazo 30d aplica 35% x 95% y riesgo bajo', () => {
  const res = EvaluadorCreditoB2B.evaluar({
    gananciaNetaMensual: 20_000_000,
    antiguedadEmpresaMeses: 48,
    plazoCreditoDias: 30,
  });

  assertEquals(res.factorAntiguedad, 0.35);
  assertEquals(res.factorPlazo, 0.95);
  // 20_000_000 * 0.35 * 0.95 = 6_650_000 -> redondeo conservador a $100k = 6_600_000
  assertEquals(res.cupoBaseCalculado, 6_650_000);
  assertEquals(res.cupoSugerido, 6_600_000);
  assertEquals(res.nivelRiesgo, 'bajo');
  assertEquals(res.viable, true);
});

Deno.test('EvaluadorCreditoB2B: empresa nueva (<12m) aplica 15% y clasifica riesgo alto', () => {
  const res = EvaluadorCreditoB2B.evaluar({
    gananciaNetaMensual: 10_000_000,
    antiguedadEmpresaMeses: 6,
    plazoCreditoDias: 15,
  });

  assertEquals(res.factorAntiguedad, 0.15);
  assertEquals(res.factorPlazo, 1.0);
  assertEquals(res.cupoSugerido, 1_500_000);
  assertEquals(res.nivelRiesgo, 'alto');
  assertEquals(res.viable, true);
});

Deno.test('EvaluadorCreditoB2B: ganancia neta inferior al mínimo ($2M) sugiere $0 y no viable', () => {
  const res = EvaluadorCreditoB2B.evaluar({
    gananciaNetaMensual: 1_500_000,
    antiguedadEmpresaMeses: 40,
    plazoCreditoDias: 30,
  });

  assertEquals(res.viable, false);
  assertEquals(res.cupoSugerido, 0);
  assertEquals(res.nivelRiesgo, 'alto');
});

Deno.test('EvaluadorCreditoB2B: respeta tope máximo de política ($50.000.000 COP)', () => {
  const res = EvaluadorCreditoB2B.evaluar({
    gananciaNetaMensual: 500_000_000,
    antiguedadEmpresaMeses: 60,
    plazoCreditoDias: 15,
  });

  assertEquals(res.cupoSugerido, 50_000_000);
  assertEquals(res.topePoliticaAplicado, 50_000_000);
  assertEquals(res.viable, true);
});

Deno.test('EvaluadorCreditoB2B: sin antigüedad especificada aplica 20% prudencial y riesgo medio a 30d', () => {
  const res = EvaluadorCreditoB2B.evaluar({
    gananciaNetaMensual: 10_000_000,
    plazoCreditoDias: 30,
  });

  assertEquals(res.factorAntiguedad, 0.2);
  assertEquals(res.factorPlazo, 0.95);
  assertEquals(res.cupoSugerido, 1_900_000);
  assertEquals(res.nivelRiesgo, 'medio');
});
