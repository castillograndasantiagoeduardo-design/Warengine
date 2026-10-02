export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  usuarioId: string;
  rolId: number;
  iat: Date;
}

export interface ITokenService {
  generarTokens(usuarioId: string, rolId: number): Promise<AuthTokens>;
  validarAccessToken(token: string): Promise<AccessTokenPayload>;
  validarRefreshToken(token: string): Promise<{ usuarioId: string }>;
  revocarRefreshToken(token: string): Promise<void>;
}
