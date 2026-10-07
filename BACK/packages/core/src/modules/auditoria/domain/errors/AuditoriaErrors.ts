import { DomainError } from '@warengine/shared-kernel';

export class FiltroAuditoriaInvalidoError extends DomainError {
  public readonly code = 'FILTRO_AUDITORIA_INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}
