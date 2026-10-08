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
} from '../../domain/entities/PoliticaBloqueoLogin.ts';

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

    // ─── 1. Control de bloqueo por cuenta (RF-SA-F1 / F3) ───────────────────
    // Se evalúa sobre el texto del email recibido aunque el usuario no exista,
    // impidiendo la enumeración de usuarios registrados.
    const ventanaCuentaMs = this.politicaBloqueo.ventanaCuentaMinutos * 60 * 1000;
    const desdeCuenta = new Date(ahora.getTime() - ventanaCuentaMs);
    const fallosCuenta = await this.controlIntentosLogin.contarFallidosPorEmail(
      request.email,
      desdeCuenta,
    );

    if (fallosCuenta >= this.politicaBloqueo.maxIntentosCuenta) {
      // Los intentos rechazados por estar bloqueado NO se insertan en intentos_login
      // de lo contrario extenderían el bloqueo indefinidamente y podrían dejar fuera
      // a un usuario legítimo por denegación de servicio permanente.
      return Result.fail(new LoginBloqueadoError());
    }

    // ─── 2. Control de bloqueo por IP (RF-SA-F2 / F3) ───────────────────────
    // Si la IP es null o 'desconocida', NO se aplica el límite por IP para no
    // agrupar a todos los orígenes desconocidos en un solo bloqueo global.
    if (request.ip && request.ip !== 'desconocida') {
      const ventanaIpMs = this.politicaBloqueo.ventanaIpMinutos * 60 * 1000;
      const desdeIp = new Date(ahora.getTime() - ventanaIpMs);
      const fallosIp = await this.controlIntentosLogin.contarFallidosPorIp(
        request.ip,
        desdeIp,
      );

      if (fallosIp >= this.politicaBloqueo.maxIntentosIp) {
        // Los intentos rechazados por estar bloqueado NO se insertan en intentos_login
        // de lo contrario extenderían el bloqueo indefinidamente.
        return Result.fail(new LoginBloqueadoError());
      }
    }

    // ─── 3. Flujo normal de verificación de credenciales ────────────────────
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
