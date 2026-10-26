import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordService } from '../../domain/services/IPasswordService.ts';
import { ITokenService, AuthTokens } from '../../domain/services/ITokenService.ts';
import { IRolRepository } from '../../domain/repositories/IRolRepository.ts';
import { IPerfilSesionRepository } from '../../domain/repositories/IPerfilSesionRepository.ts';
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
  recordarme?: boolean;
}

export interface UsuarioSesion {
  id: string;
  email: string;
  rolId: number;
  rolNombre: string;
  nombre: string | null;
  /** Sede principal del empleado vinculado; null si no tiene (el front avisa, nunca asume id=1). */
  sucursalId: number | null;
  sucursalNombre: string | null;
}

export interface LoginOutput extends AuthTokens {
  usuario: UsuarioSesion;
  permisos: string[];
}

/** Identidad y permisos que recibe el frontend tras el login, el 2FA o /auth/verificar. */
export async function construirUsuarioSesion(
  usuario: { id: string; email: string; rolId: number },
  rolRepository?: IRolRepository,
  perfilSesionRepository?: IPerfilSesionRepository,
): Promise<{ usuario: UsuarioSesion; permisos: string[] }> {
  const rolNombre = rolRepository?.obtenerNombreDeRol
    ? (await rolRepository.obtenerNombreDeRol(usuario.rolId)) ?? 'usuario'
    : 'usuario';
  const permisos = (await rolRepository?.obtenerPermisosDeRol(usuario.rolId)) ?? [];
  const perfil = (await perfilSesionRepository?.obtenerPerfil(usuario.id)) ?? null;

  return {
    usuario: {
      id: usuario.id,
      email: usuario.email,
      rolId: usuario.rolId,
      rolNombre,
      nombre: perfil?.nombre ?? null,
      sucursalId: perfil?.sucursalId ?? null,
      sucursalNombre: perfil?.sucursalNombre ?? null,
    },
    permisos,
  };
}

export type LoginResponse = Result<LoginOutput, DomainError>;

export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly registroIntentosLogin: IRegistroIntentosLogin,
    private readonly controlIntentosLogin: IControlIntentosLogin,
    private readonly rolRepository?: IRolRepository,
    private readonly politicaBloqueo: PoliticaBloqueoLogin = POLITICA_BLOQUEO_DEFAULT,
    private readonly perfilSesionRepository?: IPerfilSesionRepository,
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
      await this.registroIntentosLogin.registrar({ email: request.email, ip, exitoso: false });
      const tempToken = this.tokenService.generarToken2faTemporal
        ? await this.tokenService.generarToken2faTemporal(usuario.id)
        : undefined;
      return Result.fail(new Requiere2FAError(tempToken));
    }



    const tokens = await this.tokenService.generarTokens(
      usuario.id,
      usuario.rolId,
      request.recordarme,
    );
    await this.registroIntentosLogin.registrar({ email: request.email, ip, exitoso: true });

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

