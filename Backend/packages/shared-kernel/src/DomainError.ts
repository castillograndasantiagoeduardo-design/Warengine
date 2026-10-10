/**
 * DomainError — Clase base abstracta para todos los errores de dominio de Warengine.
 *
 * Todos los errores de negocio específicos heredan de esta clase.
 * Define un código único (`code`) para identificación interna/mapeo y
 * el mensaje descriptivo (`message`).
 */
export abstract class DomainError extends Error {
  public abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
