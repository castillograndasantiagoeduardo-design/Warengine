export interface PasswordResetTokenInfo {
  id: string | number;
  usuarioId: string;
  expiraEn: Date;
  usado: boolean;
}

export interface PasswordResetOtpRecord {
  id: number;
  usuarioId: string;
  email: string;
  codeHash: string | null;
  attempts: number;
  expiresAt: Date;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
  used: boolean;
  createdAt: Date;
}

export interface ResultadoVerificacionOtp {
  exito: boolean;
  motivo?: 'CODIGO_INCORRECTO' | 'EXPIRADO' | 'BLOQUEADO' | 'NO_ENCONTRADO' | 'YA_USADO';
  resetId?: number;
  usuarioId?: string;
  intentosRestantes?: number;
}

export interface IPasswordResetRepository {
  // Métodos del flujo Glassy OTP V4
  obtenerUltimaSolicitudPorEmail?(email: string): Promise<PasswordResetOtpRecord | null>;
  guardarOtp?(usuarioId: string, email: string, codeHash: string, expiresAt: Date): Promise<number>;
  verificarOtpConLock?(
    email: string,
    verificador: (hashGuardado: string) => boolean,
  ): Promise<ResultadoVerificacionOtp>;
  asignarResetToken?(id: number, resetTokenHash: string, resetTokenExpiresAt: Date): Promise<void>;
  buscarPorResetTokenHash?(resetTokenHash: string): Promise<PasswordResetOtpRecord | null>;
  marcarTodosComoUsadosPorUsuario?(usuarioId: string): Promise<void>;

  // Compatibilidad hacia atrás
  guardar(usuarioId: string, token: string, expiraEn: Date): Promise<void>;
  buscarTokenValido(token: string): Promise<PasswordResetTokenInfo | null>;
  marcarComoUsado(id: string | number): Promise<void>;
  contarSolicitudesRecientesPorUsuario(usuarioId: string, desde: Date): Promise<number>;
}
