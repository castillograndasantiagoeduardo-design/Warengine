import { DomainError } from '@warengine/shared-kernel';

export class DatosClienteB2BIncompletosError extends DomainError {
  public readonly code = 'CLIENTE_B2B_DATOS_INCOMPLETOS';
  constructor() {
    super('Un cliente B2B requiere dirección y teléfono.');
  }
}

export class ClienteNoEncontradoError extends DomainError {
  public readonly code = 'CLIENTE_NO_ENCONTRADO';
  constructor() {
    super('El cliente no existe.');
  }
}

export class DocumentoClienteYaRegistradoError extends DomainError {
  public readonly code = 'DOCUMENTO_CLIENTE_YA_REGISTRADO';
  constructor() {
    super('Ya existe un cliente con ese tipo y número de documento.');
  }
}

export class CreditoNoHabilitadoError extends DomainError {
  public readonly code = 'CREDITO_NO_HABILITADO';
  constructor() {
    super('Este cliente no tiene crédito corporativo habilitado.');
  }
}