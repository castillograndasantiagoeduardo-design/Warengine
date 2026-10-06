import { DomainError } from '@warengine/shared-kernel';

export class SucursalNoEncontradaError extends DomainError {
  public readonly code = 'SUCURSAL_NO_ENCONTRADA';
  constructor() { super('La sucursal no existe.'); }
}

export class SucursalDuplicadaError extends DomainError {
  public readonly code = 'SUCURSAL_DUPLICADA';
  constructor(nombre: string) {
    super(`Ya existe una sucursal con el nombre "${nombre}".`);
  }
}

export class SucursalInactivaError extends DomainError {
  public readonly code = 'SUCURSAL_INACTIVA';
  constructor() { super('No se puede asignar una sucursal inactiva.'); }
}

export class UsuarioNoEncontradoError extends DomainError {
  public readonly code = 'USUARIO_NO_ENCONTRADO';
  constructor() { super('El usuario no existe.'); }
}

export class RolNoEncontradoError extends DomainError {
  public readonly code = 'ROL_NO_ENCONTRADO';
  constructor() { super('El rol indicado no existe.'); }
}

export class EmailYaRegistradoError extends DomainError {
  public readonly code = 'EMAIL_YA_REGISTRADO';
  constructor() { super('Ya existe un usuario con ese correo.'); }
}

export class DocumentoYaRegistradoError extends DomainError {
  public readonly code = 'DOCUMENTO_YA_REGISTRADO';
  constructor() { super('Ya existe un empleado con ese documento.'); }
}

export class UltimoSuperAdminError extends DomainError {
  public readonly code = 'ULTIMO_SUPER_ADMIN';
  constructor() {
    super('No puedes quitar el rol ni desactivar al único Super Admin activo.');
  }
}

export class FiltroAuditoriaInvalidoError extends DomainError {
  public readonly code = 'FILTRO_AUDITORIA_INVALIDO';
  constructor(mensaje: string) { super(mensaje); }
}