import { DomainError } from './DomainError.ts';

/**
 * Result — Patrón Result para modelar el éxito o fracaso de operaciones de dominio
 * y casos de uso sin recurrir a excepciones como mecanismo de control de flujo.
 *
 * @template T Tipo del valor devuelto en caso de éxito.
 * @template E Tipo del error de dominio en caso de fallo, debe extender DomainError.
 */
export class Result<T, E extends DomainError = DomainError> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  public get value(): T {
    if (!this._isSuccess) {
      throw new Error('No se puede acceder al valor de un Result fallido.');
    }
    return this._value as T;
  }

  public get error(): E {
    if (this._isSuccess) {
      throw new Error('No se puede acceder al error de un Result exitoso.');
    }
    return this._error as E;
  }

  public static ok<T, E extends DomainError = DomainError>(value: T): Result<T, E>;
  public static ok<T = void, E extends DomainError = DomainError>(): Result<T, E>;
  public static ok<T, E extends DomainError = DomainError>(value?: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  public static fail<T = void, E extends DomainError = DomainError>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }
}
