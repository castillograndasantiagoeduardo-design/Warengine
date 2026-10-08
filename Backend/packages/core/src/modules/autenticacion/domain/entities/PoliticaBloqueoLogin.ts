/**
 * PoliticaBloqueoLogin.ts — Configuración inyectable para el bloqueo por intentos fallidos (RF-SA-F1, F2).
 * El core no lee variables de entorno directamente; recibe esta política construida desde el exterior.
 */
export interface PoliticaBloqueoLogin {
  /** Número máximo de intentos fallidos antes de bloquear una cuenta (defecto: 5). */
  maxIntentosCuenta: number;
  /** Ventana de tiempo deslizante en minutos para evaluar fallos de cuenta (defecto: 5). */
  ventanaCuentaMinutos: number;
  /** Número máximo de intentos fallidos antes de bloquear una dirección IP (defecto: 20). */
  maxIntentosIp: number;
  /** Ventana de tiempo deslizante en minutos para evaluar fallos de IP (defecto: 15). */
  ventanaIpMinutos: number;
}

export const POLITICA_BLOQUEO_DEFAULT: PoliticaBloqueoLogin = {
  maxIntentosCuenta: 5,
  ventanaCuentaMinutos: 5,
  maxIntentosIp: 20,
  ventanaIpMinutos: 15,
};
