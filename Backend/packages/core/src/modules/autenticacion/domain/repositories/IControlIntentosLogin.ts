/**
 * IControlIntentosLogin.ts — Puerto para control y conteo de intentos de login (RF-SA-F1, F2, F3).
 */
export interface IControlIntentosLogin {
  /**
   * Cuenta los intentos fallidos de un email desde una fecha dada.
   * Si hubo un login exitoso posterior a 'desde', el conteo inicia DESPUÉS de ese login exitoso
   * (un login exitoso reinicia el contador de la cuenta).
   */
  contarFallidosPorEmail(email: string, desde: Date): Promise<number>;

  /**
   * Cuenta los intentos fallidos de una IP desde una fecha dada.
   * El contador por IP NO se reinicia con logins exitosos.
   */
  contarFallidosPorIp(ip: string, desde: Date): Promise<number>;
}
