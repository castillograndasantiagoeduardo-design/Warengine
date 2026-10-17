export interface PasswordResetTokenInfo {
  id: string;
  usuarioId: string;
  expiraEn: Date;
  usado: boolean;
}

export interface IPasswordResetRepository {
  guardar(usuarioId: string, token: string, expiraEn: Date): Promise<void>;
  buscarTokenValido(token: string): Promise<PasswordResetTokenInfo | null>;
  marcarComoUsado(id: string): Promise<void>;
  contarSolicitudesRecientesPorUsuario(usuarioId: string, desde: Date): Promise<number>;
}
