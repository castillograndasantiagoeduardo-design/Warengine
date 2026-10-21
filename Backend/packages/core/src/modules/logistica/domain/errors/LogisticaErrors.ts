import { DomainError } from '@warengine/shared-kernel';

// --- Categorias de activos ---------------------------------------------------
export class CategoriaActivoNoEncontradaError extends DomainError {
  public readonly code = 'CATEGORIA_ACTIVO_NO_ENCONTRADA';
  constructor() { super('La categoria de activos no existe.'); }
}

export class CategoriaActivoDuplicadaError extends DomainError {
  public readonly code = 'CATEGORIA_ACTIVO_DUPLICADA';
  constructor(nombre: string) {
    super(`Ya existe una categoria de activos con el nombre "${nombre}".`);
  }
}

export class CategoriaActivoInactivaError extends DomainError {
  public readonly code = 'CATEGORIA_ACTIVO_INACTIVA';
  constructor() { super('No se puede usar una categoria de activos inactiva.'); }
}

// --- Activos -----------------------------------------------------------------
export class ActivoNoEncontradoError extends DomainError {
  public readonly code = 'ACTIVO_NO_ENCONTRADO';
  constructor() { super('El activo no existe.'); }
}

export class CodigoActivoDuplicadoError extends DomainError {
  public readonly code = 'CODIGO_ACTIVO_DUPLICADO';
  constructor(codigo: string) {
    super(`Ya existe un activo con el codigo "${codigo}".`);
  }
}

export class ActivoNoDisponibleError extends DomainError {
  public readonly code = 'ACTIVO_NO_DISPONIBLE';
  constructor() { super('El activo no esta libre para una nueva asignacion.'); }
}

export class ActivoDeBajaError extends DomainError {
  public readonly code = 'ACTIVO_DE_BAJA';
  constructor() { super('El activo esta dado de baja y no admite mas operaciones.'); }
}

export class ActivoNoPuedeDarseDeBajaError extends DomainError {
  public readonly code = 'ACTIVO_NO_PUEDE_DARSE_DE_BAJA';
  constructor(estado: string) {
    super(`No se puede dar de baja un activo en estado "${estado}". Devuelvelo o finaliza su mantenimiento primero.`);
  }
}

// --- Asignaciones ------------------------------------------------------------
export class AsignacionNoEncontradaError extends DomainError {
  public readonly code = 'ASIGNACION_NO_ENCONTRADA';
  constructor() { super('El activo no tiene una asignacion vigente.'); }
}

export class ResponsableFueraDeSucursalError extends DomainError {
  public readonly code = 'RESPONSABLE_FUERA_DE_SUCURSAL';
  constructor() { super('El empleado o area indicado no pertenece a la sucursal del activo.'); }
}

// --- Mantenimientos ----------------------------------------------------------
export class ActivoNoPermiteMantenimientoError extends DomainError {
  public readonly code = 'ACTIVO_NO_PERMITE_MANTENIMIENTO';
  constructor(estado: string) {
    super(`No se puede registrar mantenimiento a un activo en estado "${estado}".`);
  }
}

export class MantenimientoNoEncontradoError extends DomainError {
  public readonly code = 'MANTENIMIENTO_NO_ENCONTRADO';
  constructor() { super('El mantenimiento no existe.'); }
}

export class MantenimientoYaFinalizadoError extends DomainError {
  public readonly code = 'MANTENIMIENTO_YA_FINALIZADO';
  constructor() { super('El mantenimiento ya fue finalizado.'); }
}

export class FechaFinAnteriorAInicioError extends DomainError {
  public readonly code = 'FECHA_FIN_ANTERIOR_A_INICIO';
  constructor() { super('La fecha de fin no puede ser anterior a la fecha de inicio.'); }
}

export class ResponsableInactivoError extends DomainError {
  public readonly code = 'RESPONSABLE_INACTIVO';
  constructor() { super('El empleado indicado está inactivo y no puede recibir activos.'); }
}

export class FechaDevolucionInvalidaError extends DomainError {
  public readonly code = 'FECHA_DEVOLUCION_INVALIDA';
  constructor() { super('La fecha de devolución esperada no puede ser anterior a hoy.'); }
}