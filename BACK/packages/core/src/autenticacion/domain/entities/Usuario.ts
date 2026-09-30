export class Usuario {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly rolId: number,
    public readonly isActive: boolean,
    public readonly requiere2fa: boolean,
    public readonly tokensInvalidadosEn: Date | null
  ) {}

  /**
   * Verifica si un token emitido en una fecha específica (iat)
   * ya no es válido porque los tokens del usuario fueron invalidados
   * en una fecha posterior.
   * 
   * @param tokenIat Fecha de emisión del token (Issued At)
   */
  public credencialesFueronInvalidadas(tokenIat: Date): boolean {
    if (!this.tokensInvalidadosEn) {
      return false;
    }
    // Si el token fue emitido ANTES o en el mismo segundo en que se invalidaron las credenciales, es inválido.
    return tokenIat <= this.tokensInvalidadosEn;
  }
}
