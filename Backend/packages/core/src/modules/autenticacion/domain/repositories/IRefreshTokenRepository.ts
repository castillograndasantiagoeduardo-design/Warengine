export interface IRefreshTokenRepository {
  guardar(usuarioId: string, token: string, expiraEn: Date): Promise<void>;
  validar(token: string): Promise<{ usuarioId: string } | null>;
  revocar(token: string): Promise<void>;
}
