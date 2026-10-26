import { DomainError } from '@warengine/shared-kernel';

/** El mensaje es genérico a propósito: no revela si la sucursal existe ni cuáles hay. */
export class SucursalFueraDeAlcanceError extends DomainError {
  public readonly code = 'SUCURSAL_FUERA_DE_ALCANCE';
  constructor() { super('No tienes acceso a la sucursal solicitada.'); }
}

/**
 * RNF-ADM-04: un usuario con varias sedes asignadas debe indicar cuál consulta;
 * sin sucursalId la consulta quedaría sin filtro y mostraría datos de todas las sedes.
 */
export class SucursalRequeridaError extends DomainError {
  public readonly code = 'SUCURSAL_REQUERIDA';
  constructor() { super('Tienes varias sucursales asignadas: indica cuál quieres consultar.'); }
}
