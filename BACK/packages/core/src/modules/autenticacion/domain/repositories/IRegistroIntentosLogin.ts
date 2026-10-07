export interface DatosIntentoLogin {
  email: string;
  ip: string;
  exitoso: boolean;
}

/**
 * Puerto para registrar intentos de inicio de sesión (RF-SA-F4 / RF-SA-F5).
 */
export interface IRegistroIntentosLogin {
  registrar(datos: DatosIntentoLogin): Promise<void>;
}
