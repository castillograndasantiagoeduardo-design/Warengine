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

export class AreaNoEncontradaError extends DomainError {
  public readonly code = 'AREA_NO_ENCONTRADA';
  constructor() { super('El área no existe.'); }
}

export class AreaDuplicadaError extends DomainError {
  public readonly code = 'AREA_DUPLICADA';
  constructor(nombre: string) {
    super(`Ya existe un área con el nombre "${nombre}" en esta sucursal.`);
  }
}

export class AreaTieneEmpleadosError extends DomainError {
  public readonly code = 'AREA_TIENE_EMPLEADOS';
  constructor(total: number) {
    super(`No se puede eliminar el área porque tiene ${total} empleado(s) asignado(s).`);
  }
}

export class EmpleadoNoEncontradoError extends DomainError {
  public readonly code = 'EMPLEADO_NO_ENCONTRADO';
  constructor() { super('El empleado no existe.'); }
}

export class AreaNoPerteneceASucursalError extends DomainError {
  public readonly code = 'AREA_NO_PERTENECE_A_SUCURSAL';
  constructor() { super('El área indicada no pertenece a la sucursal asignada al empleado.'); }
}

export class EmpleadoInactivoError extends DomainError {
  public readonly code = 'EMPLEADO_INACTIVO';
  constructor() { super('No se puede registrar o modificar el salario de un empleado inactivo.'); }
}
