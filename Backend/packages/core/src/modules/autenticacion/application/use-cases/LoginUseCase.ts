import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordService } from '../../domain/services/IPasswordService.ts';
import { ITokenService, AuthTokens } from '../../domain/services/ITokenService.ts';
import {
  CredencialesInvalidasError,
  UsuarioInactivoError,
  Requiere2FAError,
  LoginBloqueadoError,
} from '../../domain/errors/AutenticacionErrors.ts';
import { IRegistroIntentosLogin } from '../../domain/repositories/IRegistroIntentosLogin.ts';
import { IControlIntentosLogin } from '../../domain/repositories/IControlIntentosLogin.ts';
import {
  PoliticaBloqueoLogin,
  POLITICA_BLOQUEO_DEFAULT,
} from '../../domain/value-objects/PoliticaBloqueoLogin.ts';

export interface LoginRequest {
  email: string;
  passwordPlain: string;
  ip?: string | null;
}

export type LoginResponse = Result<AuthTokens, DomainError>;

export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly registroIntentosLogin: IRegistroIntentosLogin,
    private readonly controlIntentosLogin: IControlIntentosLogin,
    private readonly politicaBloqueo: PoliticaBloqueoLogin = POLITICA_BLOQUEO_DEFAULT,
  ) {}

  public async execute(request: LoginRequest): Promise<LoginResponse> {
    const ip = request.ip ?? 'desconocida';
    const ahora = new Date();

    // 1. Comprobar bloqueo por cuenta (ventana deslizante)
    // Se aplica al texto del email aunque ese usuario no exista en la BD (RF-SA-F1/F2)
    const desdeCuenta = new Date(
      ahora.getTime() - this.politicaBloqueo.ventanaCuentaMinutos * 60 * 1000,
    );
    const fallosCuenta = await this.controlIntentosLogin.contarFallosRecientesPorEmail(
      request.email,
      desdeCuenta,
    );

    if (fallosCuenta >= this.politicaBloqueo.maxIntentosCuenta) {
      // Los intentos rechazados por estar bloqueado NO se insertan en intentos_login;
      // de lo contrario extenderían el bloqueo indefinidamente y un atacante podría dejar fuera
      // a un usuario legítimo de forma permanente.
      return Result.fail(new LoginBloqueadoError());
    }

    // 2. Comprobar bloqueo por IP si es conocida (no agrupar desconocidos o nulls)
    const ipNormalizada = request.ip?.trim();
    const esIpValida = Boolean(ipNormalizada && ipNormalizada !== 'desconocida');

    if (esIpValida) {
      const desdeIp = new Date(
        ahora.getTime() - this.politicaBloqueo.ventanaIpMinutos * 60 * 1000,
      );
      const fallosIp = await this.controlIntentosLogin.contarFallosRecientesPorIp(
        ipNormalizada!,
        desdeIp,
      );

      if (fallosIp >= this.politicaBloqueo.maxIntentosIp) {
        // De igual forma, no registrar el intento para no perpetuar el bloqueo de la IP.
        return Result.fail(new LoginBloqueadoError());
      }
    }

    // 3. Proceso normal de autenticación (verificación de usuario y contraseña)
    const usuario = await this.usuarioRepository.findByEmail(request.email);

    if (!usuario) {
      await this.registroIntentosLogin.registrar({ email: request.email, ip, exitoso: false });
      return Result.fail(new CredencialesInvalidasError());
    }

    if (!usuario.isActive) {
      await this.registroIntentosLogin.registrar({ email: request.email, ip, exitoso: false });
      return Result.fail(new UsuarioInactivoError());
    }

    const isPasswordValid = await this.passwordService.comparar(
      request.passwordPlain,
      usuario.passwordHash,
    );
    if (!isPasswordValid) {
      await this.registroIntentosLogin.registrar({ email: request.email, ip, exitoso: false });
      return Result.fail(new CredencialesInvalidasError());
    }

    if (usuario.requiere2fa) {
      // Nota: Aquí se implementaría flujo 2FA si corresponde.
      await this.registroIntentosLogin.registrar({ email: request.email, ip, exitoso: false });
      return Result.fail(new Requiere2FAError());
    }

    const tokens = await this.tokenService.generarTokens(usuario.id, usuario.rolId);
    await this.registroIntentosLogin.registrar({ email: request.email, ip, exitoso: true });
    return Result.ok(tokens);
  }
}
