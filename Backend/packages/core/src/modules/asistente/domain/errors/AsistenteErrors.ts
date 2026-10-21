import { DomainError } from '@warengine/shared-kernel';

export class ErrorComunicacionAsistenteError extends DomainError {
  public readonly code = 'ERROR_COMUNICACION_ASISTENTE';
  constructor(mensaje: string = 'No se pudo establecer comunicación con el modelo de inteligencia artificial.') {
    super(mensaje);
  }
}

export class MensajeAsistenteVacioError extends DomainError {
  public readonly code = 'MENSAJE_ASISTENTE_VACIO';
  constructor() {
    super('El mensaje para el asistente conversacional no puede estar vacío.');
  }
}
