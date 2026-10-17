import { SignJWT, jwtVerify } from 'jose';
import {
  ITokenService,
  AuthTokens,
  AccessTokenPayload,
  IRefreshTokenRepository,
} from '@warengine/core';

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtSecret: Uint8Array,
  ) {}

  public async generarTokens(usuarioId: string, rolId: number, recordarme = false): Promise<AuthTokens> {
    const accessToken = await new SignJWT({ usuarioId, rolId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(this.jwtSecret);

    const refreshToken = crypto.randomUUID();
    const expiraEn = new Date();
    // RF-SA-G4: Si recordarme es true, extender a 30 días; por defecto, 7 días rotativos (RF-SA-D6).
    const diasVigencia = recordarme ? 30 : 7;
    expiraEn.setDate(expiraEn.getDate() + diasVigencia);

    await this.refreshTokenRepo.guardar(usuarioId, refreshToken, expiraEn);

    return { accessToken, refreshToken };
  }

  public async validarAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, this.jwtSecret);

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

  public async generarToken2faTemporal(usuarioId: string): Promise<string> {
    return await new SignJWT({ usuarioId, purpose: '2fa_pending' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(this.jwtSecret);
  }

  public async validarToken2faTemporal(token: string): Promise<{ usuarioId: string }> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);
      if (payload.purpose !== '2fa_pending' || !payload.usuarioId) {
        throw new Error('Propósito de token incorrecto');
      }
      return { usuarioId: payload.usuarioId as string };
    } catch {
      throw new Error('Token 2FA temporal inválido o expirado');
    }
  }
}

