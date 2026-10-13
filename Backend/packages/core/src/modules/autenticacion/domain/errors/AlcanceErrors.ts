import { DomainError } from '@warengine/shared-kernel';

/** El mensaje es genérico a propósito: no revela si la sucursal existe ni cuáles hay. */
export class SucursalFueraDeAlcanceError extends DomainError {
  public readonly code = 'SUCURSAL_FUERA_DE_ALCANCE';
  constructor() { super('No tienes acceso a la sucursal solicitada.'); }
}
