import type {
  EvaluacionCreditoB2BDto,
  NivelRiesgoCredito,
  PlazoCreditoDias,
} from '@warengine/contracts';

export interface ParametrosEvaluacionCreditoB2B {
  gananciaNetaMensual: number;
  antiguedadEmpresaMeses?: number | null;
  plazoCreditoDias?: PlazoCreditoDias | null;
  topePoliticaMaximo?: number;
}

/**
 * Motor puro de reglas de negocio para evaluación preliminar de cupo de crédito B2B.
 *
 * Reglas financieras aplicadas (estándar prudencial B2B):
 * 1. Factor por antigüedad sobre la ganancia neta mensual:
 *    - < 12 meses: 15% (riesgo alto)
 *    - 12 a 35 meses: 25% (riesgo medio)
 *    - >= 36 meses: 35% (riesgo bajo)
 *    - Sin especificar: 20% (criterio prudencial)
 * 2. Factor de ajuste por plazo de cartera:
 *    - 15 días: 1.00 | 30 días: 0.95 | 45 días: 0.85 | 60 días: 0.75
 * 3. Redondeo conservador hacia abajo a múltiplos de $100.000 COP.
 * 4. Umbral mínimo de viabilidad: ganancia neta >= $2.000.000 y cupo sugerido >= $500.000.
 * 5. Tope máximo por política empresarial (default $50.000.000 COP).
 */
export class EvaluadorCreditoB2B {
  public static readonly UMBRAL_MINIMO_GANANCIA_NETA = 2_000_000;
  public static readonly UMBRAL_MINIMO_CUPO = 500_000;
  public static readonly TOPE_POLITICA_DEFAULT = 50_000_000;

  private static readonly FACTOR_PLAZO: Record<PlazoCreditoDias, number> = {
    15: 1.0,
    30: 0.95,
    45: 0.85,
    60: 0.75,
  };

  public static evaluar(params: ParametrosEvaluacionCreditoB2B): EvaluacionCreditoB2BDto {
    const ganancia = Math.max(0, Number(params.gananciaNetaMensual) || 0);
    const antiguedad =
      params.antiguedadEmpresaMeses !== undefined && params.antiguedadEmpresaMeses !== null
        ? Math.max(0, Math.floor(params.antiguedadEmpresaMeses))
        : null;
    const plazo: PlazoCreditoDias = params.plazoCreditoDias ?? 30;
    const topePolitica = params.topePoliticaMaximo ?? EvaluadorCreditoB2B.TOPE_POLITICA_DEFAULT;

    const factorAntiguedad = EvaluadorCreditoB2B.obtenerFactorAntiguedad(antiguedad);
    const factorPlazo = EvaluadorCreditoB2B.FACTOR_PLAZO[plazo] ?? 0.95;

    const cupoBaseCalculado = Math.round(ganancia * factorAntiguedad * factorPlazo * 100) / 100;
    const cupoRedondeado = Math.floor(cupoBaseCalculado / 100_000) * 100_000;
    const cupoAcotado = Math.min(cupoRedondeado, topePolitica);

    const viable =
      ganancia >= EvaluadorCreditoB2B.UMBRAL_MINIMO_GANANCIA_NETA &&
      cupoAcotado >= EvaluadorCreditoB2B.UMBRAL_MINIMO_CUPO;

    const cupoSugerido = viable ? cupoAcotado : 0;
    const nivelRiesgo = EvaluadorCreditoB2B.clasificarRiesgo(ganancia, antiguedad, plazo, viable);

    const pctAnt = Math.round(factorAntiguedad * 100);
    const pctPlazo = Math.round(factorPlazo * 100);

    let justificacion: string;
    if (!viable) {
      justificacion =
        ganancia < EvaluadorCreditoB2B.UMBRAL_MINIMO_GANANCIA_NETA
          ? `La ganancia neta mensual declarada es inferior al mínimo de política ($2.000.000 COP). Se recomienda operar únicamente de contado hasta contar con garantías.`
          : `El cupo resultante tras aplicar factores de riesgo (${pctAnt}% antigüedad × ${pctPlazo}% plazo) es inferior al mínimo viable ($500.000 COP). Se recomienda operar de contado.`;
    } else if (cupoRedondeado > topePolitica) {
      justificacion = `Cálculo base (${pctAnt}% sobre ganancia neta × ${pctPlazo}% por plazo de ${plazo} días) acotado al tope máximo por política ($${topePolitica.toLocaleString('es-CO')} COP). Sujeto a aprobación del Super Admin.`;
    } else {
      justificacion = `Cupo estimado aplicando ${pctAnt}% de cobertura sobre la ganancia neta mensual y factor de ${pctPlazo}% para plazo de ${plazo} días. Sujeto a aprobación del Super Admin.`;
    }

    return {
      gananciaNetaMensual: ganancia,
      antiguedadEmpresaMeses: antiguedad,
      plazoCreditoDias: plazo,
      factorAntiguedad,
      factorPlazo,
      cupoBaseCalculado,
      cupoSugerido,
      topePoliticaAplicado: topePolitica,
      nivelRiesgo,
      viable,
      justificacion,
    };
  }

  private static obtenerFactorAntiguedad(antiguedadMeses: number | null): number {
    if (antiguedadMeses === null) return 0.2;
    if (antiguedadMeses < 12) return 0.15;
    if (antiguedadMeses < 36) return 0.25;
    return 0.35;
  }

  private static clasificarRiesgo(
    ganancia: number,
    antiguedad: number | null,
    plazo: PlazoCreditoDias,
    viable: boolean,
  ): NivelRiesgoCredito {
    if (!viable) return 'alto';
    if ((antiguedad !== null && antiguedad < 12) || plazo >= 60) return 'alto';
    if (antiguedad !== null && antiguedad >= 36 && plazo <= 30 && ganancia >= 10_000_000) {
      return 'bajo';
    }
    return 'medio';
  }
}
