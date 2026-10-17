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
  generarTokens(usuarioId: string, rolId: number, recordarme?: boolean): Promise<AuthTokens>;
  validarAccessToken(token: string): Promise<AccessTokenPayload>;
  validarRefreshToken(token: string): Promise<{ usuarioId: string }>;
  revocarRefreshToken(token: string): Promise<void>;
  generarToken2faTemporal?(usuarioId: string): Promise<string>;
  validarToken2faTemporal?(token: string): Promise<{ usuarioId: string }>;
}


