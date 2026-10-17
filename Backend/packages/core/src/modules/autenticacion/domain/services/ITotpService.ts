export interface GenerarSecretoTotpOutput {
  secretBase32: string;
  otpauthUrl: string;
}

export interface ITotpService {
  /**
   * Genera un secreto aleatorio en Base32 (160 bits / 20 bytes)
   * y la URI otpauth:// correspondiente para escanear en apps como Google Authenticator.
   */
  generarSecreto(email: string, issuer?: string): GenerarSecretoTotpOutput;

  /**
   * Valida un código TOTP de 6 dígitos contra el secreto base32,
   * permitiendo una ventana deslizante de tolerancia (±1 intervalo de 30s).
   */
  validarCodigo(secretBase32: string, token: string): Promise<boolean>;
}
