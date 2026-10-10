import { and, count, desc, eq, gt, gte } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { intentos_login } from '../../schema/autenticacion.schema.ts';
import {
  DatosIntentoLogin,
  IControlIntentosLogin,
  IRegistroIntentosLogin,
} from '@warengine/core';

export class DrizzleIntentoLoginRepository
  implements IRegistroIntentosLogin, IControlIntentosLogin {
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

  /**
   * Cuenta los intentos fallidos de login para un email desde una fecha determinada.
   * El conteo reinicia con el último intento exitoso: solo cuenta fallos posteriores
   * al login exitoso más reciente de dicho email (RF-SA-F1).
   * Aprovecha el índice idx_intentos_login_email.
   */
  public async contarFallosRecientesPorEmail(email: string, desde: Date): Promise<number> {
    // 1. Buscar la fecha del último login exitoso de ese email
    const [ultimoExito] = await this.db
      .select({ fecha: intentos_login.fecha })
      .from(intentos_login)
      .where(
        and(
          eq(intentos_login.email, email),
          eq(intentos_login.exitoso, 1),
        ),
      )
      .orderBy(desc(intentos_login.fecha))
      .limit(1);

    // 2. Si hubo un login exitoso posterior a la ventana 'desde', el conteo inicia después de dicho éxito
    const condicionFecha = ultimoExito && ultimoExito.fecha > desde
      ? gt(intentos_login.fecha, ultimoExito.fecha)
      : gte(intentos_login.fecha, desde);

    const [resultado] = await this.db
      .select({ total: count() })
      .from(intentos_login)
      .where(
        and(
          eq(intentos_login.email, email),
          eq(intentos_login.exitoso, 0),
          condicionFecha,
        ),
      );

    return Number(resultado?.total ?? 0);
  }

  /**
   * Cuenta los intentos fallidos de login para una dirección IP desde una fecha determinada.
   * NO se reinicia con logins exitosos para evitar que atacantes intercalen logins propios válidos (RF-SA-F3).
   * Aprovecha el índice idx_intentos_login_ip.
   */
  public async contarFallosRecientesPorIp(ip: string, desde: Date): Promise<number> {
    const [resultado] = await this.db
      .select({ total: count() })
      .from(intentos_login)
      .where(
        and(
          eq(intentos_login.ip, ip),
          eq(intentos_login.exitoso, 0),
          gte(intentos_login.fecha, desde),
        ),
      );

    return Number(resultado?.total ?? 0);
  }
}
