import { Database } from '../../client.ts';
import { intentos_login } from '../../schema/autenticacion.schema.ts';
import { DatosIntentoLogin, IRegistroIntentosLogin } from '@warengine/core';

export class DrizzleIntentoLoginRepository implements IRegistroIntentosLogin {
  constructor(private readonly db: Database) {}

  /**
   * Inserta un registro de intento de login.
   * Si falla, no interrumpe el flujo de login y registra el error en consola.
   */
  public async registrar(datos: DatosIntentoLogin): Promise<void> {
    try {
      await this.db.insert(intentos_login).values({
        email: datos.email,
        ip: datos.ip,
        exitoso: datos.exitoso ? 1 : 0,
      });
    } catch (error) {
      console.error(
        `[intentos_login] No se pudo registrar intento de login para email=${datos.email}, exitoso=${datos.exitoso}:`,
        error,
      );
    }
  }
}
