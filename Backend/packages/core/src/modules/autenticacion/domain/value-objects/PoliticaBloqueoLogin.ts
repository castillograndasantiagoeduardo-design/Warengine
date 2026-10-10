/**
 * Parámetros de la política de bloqueo por intentos fallidos de autenticación.
 */
export interface PoliticaBloqueoLogin {
  /** Máximo de intentos fallidos permitidos por cuenta antes de bloquear. */
  maxIntentosCuenta: number;
  /** Ventana deslizante en minutos para evaluar intentos fallidos por cuenta. */
  ventanaCuentaMinutos: number;
  /** Máximo de intentos fallidos permitidos por IP antes de bloquear. */
  maxIntentosIp: number;
  /** Ventana deslizante en minutos para evaluar intentos fallidos por IP. */
  ventanaIpMinutos: number;
}

export const POLITICA_BLOQUEO_DEFAULT: PoliticaBloqueoLogin = {
  maxIntentosCuenta: 5,
  ventanaCuentaMinutos: 5,
  maxIntentosIp: 20,
  ventanaIpMinutos: 15,
};
