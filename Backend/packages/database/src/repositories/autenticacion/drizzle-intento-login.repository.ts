import { eq, and, gt, gte, desc, count } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { intentos_login } from '../../schema/autenticacion.schema.ts';
import {
  DatosIntentoLogin,
  IRegistroIntentosLogin,
  IControlIntentosLogin,
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
   * Cuenta los intentos fallidos de un email desde una fecha dada.
   * Si hubo un login exitoso posterior o igual a 'desde', el conteo inicia DESPUÉS de ese login exitoso
   * (un login exitoso reinicia el contador de la cuenta).
   * Aprovecha el índice idx_intentos_login_email.
   */
  public async contarFallidosPorEmail(email: string, desde: Date): Promise<number> {
    // 1. Buscar fecha del último login exitoso de ese email
    const [ultimoExito] = await this.db
      .select({ fecha: intentos_login.fecha })
      .from(intentos_login)
      .where(and(
        eq(intentos_login.email, email),
        eq(intentos_login.exitoso, 1),
      ))
      .orderBy(desc(intentos_login.fecha))
      .limit(1);

    // 2. Si hubo un login exitoso en la ventana, solo se cuentan fallos posteriores a ese éxito
    const fechaCorte = (ultimoExito && ultimoExito.fecha >= desde) ? ultimoExito.fecha : null;

    const condiciones = [
      eq(intentos_login.email, email),
      eq(intentos_login.exitoso, 0),
    ];

    if (fechaCorte) {
      condiciones.push(gt(intentos_login.fecha, fechaCorte));
    } else {
      condiciones.push(gte(intentos_login.fecha, desde));
    }

    const [resultado] = await this.db
      .select({ total: count() })
      .from(intentos_login)
      .where(and(...condiciones));

    return resultado?.total ?? 0;
  }

  /**
   * Cuenta los intentos fallidos de una IP desde una fecha dada.
   * Para la IP NO se reinicia con un éxito (previene que un atacante intercale un login válido).
   * Aprovecha el índice idx_intentos_login_ip.
   */
  public async contarFallidosPorIp(ip: string, desde: Date): Promise<number> {
    const [resultado] = await this.db
      .select({ total: count() })
      .from(intentos_login)
      .where(and(
        eq(intentos_login.ip, ip),
        eq(intentos_login.exitoso, 0),
        gte(intentos_login.fecha, desde),
      ));

    return resultado?.total ?? 0;
  }
}
