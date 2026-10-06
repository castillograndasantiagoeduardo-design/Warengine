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

  //Devuelve true si la operación se ejecutó correctamente.
  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  //Devuelve true si la operación falló.
  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  //Es para acceder al valor de la operacion exitosa o obtener el error si hubo uno, se valida con isSucess para saber si la operacion tuvo exito, de lo contrario no deja acceder al valor
  public get value(): T {
    if (!this._isSuccess) {
      throw new Error('No se puede acceder al valor de un Result fallido.');
    }
    return this._value as T;
  }

  //Permite acceder al objeto de error de dominio (DomainError) si la operacion fallo, pero antes valida si la operacion fue exitosa, porque no habria error en una operacion exitosa.
  public get error(): E {
    if (this._isSuccess) {
      throw new Error('No se puede acceder al error de un Result exitoso.');
    }
    return this._error as E;
  }

  //dos primeras líneas son sobrecargas de TypeScript: permiten llamar tanto a Result.ok(usuario) (cuando retornas un dato T) como a Result.ok() (cuando la operación tiene éxito pero no necesita devolver nada, tipo void).
  public static ok<T, E extends DomainError = DomainError>(value: T): Result<T, E>;
  public static ok<T = void, E extends DomainError = DomainError>(): Result<T, E>;

  //La tercera linea es la implementacion real del metodo ok y crea una instancia de Result con el valo proporcionado por el usuario y con un estado de exito.
  public static ok<T, E extends DomainError = DomainError>(value?: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  //de la misma forma que ok, crea una instancia de Result pero en estado de fracaso. se pasa el error de dominio como parametro.
  public static fail<T = void, E extends DomainError = DomainError>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }
}
