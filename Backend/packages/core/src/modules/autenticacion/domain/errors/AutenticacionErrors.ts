import { DomainError } from '@warengine/shared-kernel';

export class CredencialesInvalidasError extends DomainError {
  public readonly code = 'CREDENCIALES_INVALIDAS';
  constructor() {
    super('Email o contraseña incorrectos.');
  }
}

export class UsuarioInactivoError extends DomainError {
  public readonly code = 'USUARIO_INACTIVO';
  constructor() {
    super('El usuario se encuentra inactivo.');
  }
}

export class PermisoDenegadoError extends DomainError {
  public readonly code = 'PERMISO_DENEGADO';
  constructor(accion: string) {
    super(`No tienes permiso para ejecutar la acción: ${accion}`);
  }
}

export class TokenInvalidoError extends DomainError {
  public readonly code = 'TOKEN_INVALIDO';
  constructor(mensaje = 'Token inválido o expirado.') {
    super(mensaje);
  }
}

export class Requiere2FAError extends DomainError {
  public readonly code = 'REQUIERE_2FA';
  public readonly tempToken?: string;
  constructor(tempToken?: string) {
    super('Se requiere código de autenticación de dos factores.');
    this.tempToken = tempToken;
  }
}

export class LoginBloqueadoError extends DomainError {
  public readonly code = 'LOGIN_BLOQUEADO';
  constructor(mensaje = 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.') {
    super(mensaje);
  }
}

export class CodigoTotpInvalidoError extends DomainError {
  public readonly code = 'CODIGO_TOTP_INVALIDO';
  constructor(mensaje = 'El código de autenticación de dos factores es incorrecto o ha expirado.') {
    super(mensaje);
  }
}

export class TotpNoConfiguradoError extends DomainError {
  public readonly code = 'TOTP_NO_CONFIGURADO';
  constructor(mensaje = 'La autenticación de dos factores no está configurada o activa para este usuario.') {
    super(mensaje);
  }
}

export class TotpYaActivadoError extends DomainError {
  public readonly code = 'TOTP_YA_ACTIVADO';
  constructor(mensaje = 'La autenticación de dos factores ya se encuentra activada.') {
    super(mensaje);
  }
}

export class TokenRecuperacionInvalidoError extends DomainError {
  public readonly code = 'TOKEN_RECUPERACION_INVALIDO';
  constructor(mensaje = 'El enlace de recuperación es inválido o ha expirado.') {
    super(mensaje);
  }
}

export class LimiteSolicitudesRecuperacionExcedidoError extends DomainError {
  public readonly code = 'LIMITE_SOLICITUDES_EXCEDIDO';
  constructor(mensaje = 'Demasiadas solicitudes de recuperación de contraseña. Intente nuevamente en unos minutos.') {
    super(mensaje);
  }
}

export class PasswordsNoCoincidenError extends DomainError {
  public readonly code = 'PASSWORDS_NO_COINCIDEN';
  constructor(mensaje = 'Las contraseñas ingresadas no coinciden.') {
    super(mensaje);
  }
}

export class CodigoOtpInvalidoError extends DomainError {
  public readonly code = 'CODIGO_OTP_INVALIDO';
  public readonly intentosRestantes?: number;
  constructor(mensaje = 'El código ingresado es incorrecto.', intentosRestantes?: number) {
    super(mensaje);
    this.intentosRestantes = intentosRestantes;
  }
}

export class CodigoOtpExpiradoError extends DomainError {
  public readonly code = 'CODIGO_OTP_EXPIRADO';
  constructor(mensaje = 'El código ha expirado. Solicita uno nuevo.') {
    super(mensaje);
  }
}

export class CodigoOtpBloqueadoError extends DomainError {
  public readonly code = 'CODIGO_OTP_BLOQUEADO';
  constructor(
    mensaje = 'Has superado el límite de 5 intentos. El código ha sido bloqueado por seguridad. Solicita uno nuevo.',
  ) {
    super(mensaje);
  }
}

export class ReenvioOtpEnCooldownError extends DomainError {
  public readonly code = 'REENVIO_EN_COOLDOWN';
  public readonly segundosRestantes: number;
  constructor(segundosRestantes: number) {
    super(
      `Debes esperar ${segundosRestantes} segundos antes de solicitar un nuevo código de verificación.`,
    );
    this.segundosRestantes = segundosRestantes;
  }
}

export class ResetTokenInvalidoError extends DomainError {
  public readonly code = 'RESET_TOKEN_INVALIDO';
  constructor(mensaje = 'El token de restablecimiento es inválido o ha expirado.') {
    super(mensaje);
  }
}




