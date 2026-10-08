import { SignJWT, jwtVerify } from 'jose';
import {
  ITokenService,
  AuthTokens,
  AccessTokenPayload,
  IRefreshTokenRepository,
} from '@warengine/core';

export class JwtTokenService implements ITokenService {
  private readonly secretKey: Uint8Array;

  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    jwtSecret: string | Uint8Array,
  ) {
    if (typeof jwtSecret === 'string') {
      if (!jwtSecret || jwtSecret.length < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
      }
      this.secretKey = new TextEncoder().encode(jwtSecret);
    } else {
      if (!jwtSecret || jwtSecret.length < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 bytes.');
      }
      this.secretKey = jwtSecret;
    }
  }

  public async generarTokens(usuarioId: string, rolId: number): Promise<AuthTokens> {
    const accessToken = await new SignJWT({ usuarioId, rolId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(this.secretKey);

    const refreshToken = crypto.randomUUID();
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7); // 7 días

    await this.refreshTokenRepo.guardar(usuarioId, refreshToken, expiraEn);

    return { accessToken, refreshToken };
  }

  public async validarAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, this.secretKey);

    return {
      usuarioId: payload.usuarioId as string,
      rolId: payload.rolId as number,
      iat: new Date((payload.iat as number) * 1000),
    };
  }

  public async validarRefreshToken(token: string): Promise<{ usuarioId: string }> {
    const result = await this.refreshTokenRepo.validar(token);
    if (!result) {
      throw new Error('Refresh token inválido o expirado');
    }
    return result;
  }

  public async revocarRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepo.revocar(token);
  }
}
