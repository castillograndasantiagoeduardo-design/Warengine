import { DomainError } from '../../../../../shared-kernel/mod.ts';

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
  constructor() {
    super('Se requiere código de autenticación de dos factores.');
  }
}
