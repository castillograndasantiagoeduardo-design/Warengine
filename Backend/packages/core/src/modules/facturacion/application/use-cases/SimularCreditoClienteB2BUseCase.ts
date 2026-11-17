import { DomainError, Result } from '@warengine/shared-kernel';
import type { EvaluacionCreditoB2BDto, PlazoCreditoDias } from '@warengine/contracts';
import { EvaluadorCreditoB2B } from '../../domain/services/EvaluadorCreditoB2B.ts';

export interface SimularCreditoClienteB2BRequest {
  gananciaNetaMensual: number;
  antiguedadEmpresaMeses?: number | null;
  plazoCreditoDias?: PlazoCreditoDias | null;
}

export type SimularCreditoClienteB2BResponse = Result<EvaluacionCreditoB2BDto, DomainError>;

export class SimularCreditoClienteB2BUseCase {
  constructor(
    private readonly topeCreditoPolitica: number = EvaluadorCreditoB2B.TOPE_POLITICA_DEFAULT,
  ) {}

  public execute(request: SimularCreditoClienteB2BRequest): SimularCreditoClienteB2BResponse {
    const evaluacion = EvaluadorCreditoB2B.evaluar({
      gananciaNetaMensual: request.gananciaNetaMensual,
      antiguedadEmpresaMeses: request.antiguedadEmpresaMeses ?? null,
      plazoCreditoDias: request.plazoCreditoDias ?? 30,
      topePoliticaMaximo: this.topeCreditoPolitica,
    });
    return Result.ok(evaluacion);
  }
}
