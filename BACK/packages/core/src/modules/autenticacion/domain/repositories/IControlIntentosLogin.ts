/**
 * Puerto para consultar intentos de inicio de sesión y controlar fuerza bruta (RF-SA-F1, RF-SA-F2, RF-SA-F3).
 */
export interface IControlIntentosLogin {
  /**
   * Cuenta los intentos fallidos de login para un email desde una fecha determinada.
   * El conteo solo toma en cuenta intentos posteriores al último login exitoso de ese email.
   */
  contarFallosRecientesPorEmail(email: string, desde: Date): Promise<number>;

  /**
   * Cuenta los intentos fallidos de login para una dirección IP desde una fecha determinada.
   * No se reinicia con logins exitosos para evitar evasión intercalada.
   */
  contarFallosRecientesPorIp(ip: string, desde: Date): Promise<number>;
}
