import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { ITotpService } from '../../domain/services/ITotpService.ts';
import { ITokenService } from '../../domain/services/ITokenService.ts';
import { IRegistroIntentosLogin } from '../../domain/repositories/IRegistroIntentosLogin.ts';
import { IRolRepository } from '../../domain/repositories/IRolRepository.ts';
import {
  CodigoTotpInvalidoError,
  TotpNoConfiguradoError,
  UsuarioInactivoError,
  TokenInvalidoError,
} from '../../domain/errors/AutenticacionErrors.ts';
import { IPerfilSesionRepository } from '../../domain/repositories/IPerfilSesionRepository.ts';
import { construirUsuarioSesion, LoginOutput } from './LoginUseCase.ts';

export interface Verificar2FALoginRequest {
  tempToken: string;
  codigoTotp: string;
  ip?: string | null;
  recordarme?: boolean;
}

export type Verificar2FALoginResponse = Result<LoginOutput, DomainError>;

export class Verificar2FALoginUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly totpService: ITotpService,
    private readonly tokenService: ITokenService,
    private readonly registroIntentosLogin: IRegistroIntentosLogin,
    private readonly rolRepository?: IRolRepository,
    private readonly perfilSesionRepository?: IPerfilSesionRepository,
  ) {}

  public async execute(request: Verificar2FALoginRequest): Promise<Verificar2FALoginResponse> {
    const ip = request.ip ?? 'desconocida';

    if (!this.tokenService.validarToken2faTemporal) {
      return Result.fail(new TokenInvalidoError('El servicio de token no soporta verificación 2FA.'));
    }

    let tokenData: { usuarioId: string };
    try {
      tokenData = await this.tokenService.validarToken2faTemporal(request.tempToken);
    } catch {
      return Result.fail(new TokenInvalidoError('Token temporal de autenticación inválido o expirado.'));
    }

    const usuario = await this.usuarioRepository.findById(tokenData.usuarioId);
    if (!usuario) {
      return Result.fail(new TokenInvalidoError('Usuario no encontrado.'));
    }

    if (!usuario.isActive) {
      await this.registroIntentosLogin.registrar({ email: usuario.email, ip, exitoso: false });
      return Result.fail(new UsuarioInactivoError());
    }

    if (!usuario.requiere2fa || !usuario.totpSecret) {
      return Result.fail(new TotpNoConfiguradoError());
    }

    const esValido = await this.totpService.validarCodigo(usuario.totpSecret, request.codigoTotp);
    if (!esValido) {
      await this.registroIntentosLogin.registrar({ email: usuario.email, ip, exitoso: false });
      return Result.fail(new CodigoTotpInvalidoError());
    }

    // Registro exitoso en intentos_login (resetea ventana de bloqueo)
    await this.registroIntentosLogin.registrar({ email: usuario.email, ip, exitoso: true });

    // Emisión de tokens de sesión definitivos (RF-SA-G4: respeta recordarme)
    const tokens = await this.tokenService.generarTokens(
      usuario.id,
      usuario.rolId,
      request.recordarme,
    );

    const sesion = await construirUsuarioSesion(
      usuario,
      this.rolRepository,
      this.perfilSesionRepository,
    );

    return Result.ok({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      ...sesion,
    });
  }
}
