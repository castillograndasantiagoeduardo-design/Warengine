import { SignJWT, jwtVerify } from 'jose';
import { ITokenService, AuthTokens, AccessTokenPayload } from '../../../core/src/autenticacion/domain/services/ITokenService.ts';
import { IRefreshTokenRepository } from '../../../core/src/autenticacion/domain/repositories/IRefreshTokenRepository.ts';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'warengine_secret_key_123');

export class JwtTokenService implements ITokenService {
  constructor(private readonly refreshTokenRepo: IRefreshTokenRepository) {}

  public async generarTokens(usuarioId: string, rolId: number): Promise<AuthTokens> {
    const accessToken = await new SignJWT({ usuarioId, rolId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);

    const refreshToken = crypto.randomUUID();
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7); // 7 días

    await this.refreshTokenRepo.guardar(usuarioId, refreshToken, expiraEn);

    return { accessToken, refreshToken };
  }

  public async validarAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      usuarioId: payload.usuarioId as string,
      rolId: payload.rolId as number,
      iat: new Date((payload.iat as number) * 1000)
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
