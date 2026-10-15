import { DomainError } from '@warengine/shared-kernel';

export class CategoriaNoEncontradaError extends DomainError {
  public readonly code = 'CATEGORIA_NO_ENCONTRADA';
  constructor() {
    super('La categoría no existe.');
  }
}

export class ProveedorNoEncontradoError extends DomainError {
  public readonly code = 'PROVEEDOR_NO_ENCONTRADO';
  constructor() {
    super('El proveedor no existe.');
  }
}

export class ProductoNoEncontradoError extends DomainError {
  public readonly code = 'PRODUCTO_NO_ENCONTRADO';
  constructor() {
    super('El producto no existe.');
  }
}

/** Error cuando un producto está inactivo en catálogo maestro y se intenta operar sobre él. */
export class ProductoInactivoError extends DomainError {
  public readonly code = 'PRODUCTO_INACTIVO';
  constructor() {
    super('El producto seleccionado está inactivo en el catálogo.');
  }
}

export class SkuDuplicadoError extends DomainError {
  public readonly code = 'SKU_DUPLICADO';
  constructor(sku?: string) {
    super(sku ? `Ya existe un producto con el SKU "${sku}".` : 'Ya existe un producto con ese SKU.');
  }
}

export class CategoriaInactivaError extends DomainError {
  public readonly code = 'CATEGORIA_INACTIVA';
  constructor() {
    super('La categoría seleccionada está inactiva.');
  }
}

export class ProveedorInactivoError extends DomainError {
  public readonly code = 'PROVEEDOR_INACTIVO';
  constructor() {
    super('El proveedor seleccionado está inactivo.');
  }
}

export class ReferenciaInvalidaError extends DomainError {
  public readonly code = 'REFERENCIA_INVALIDA';
  constructor(mensaje: string = 'La referencia de clave foránea es inválida.') {
    super(mensaje);
  }
}

export class SkuModificacionNoPermitidaError extends DomainError {
  public readonly code = 'SKU_MODIFICACION_NO_PERMITIDA';
  constructor() {
    super('No se permite modificar el SKU de un producto que ya registra movimientos.');
  }
}

export class StockInsuficienteError extends DomainError {
  public readonly code = 'STOCK_INSUFICIENTE';
  constructor(disponible: number, solicitado: number) {
    super(`Stock insuficiente. Disponible: ${disponible}, solicitado: ${solicitado}.`);
  }
}

export class CantidadInvalidaError extends DomainError {
  public readonly code = 'CANTIDAD_INVALIDA';
  constructor(mensaje: string = 'La cantidad debe ser un entero positivo mayor a cero.') {
    super(mensaje);
  }
}

export class MotivoSalidaRequeridoError extends DomainError {
  public readonly code = 'MOTIVO_SALIDA_REQUERIDO';
  constructor() {
    super('El motivo de la salida manual es obligatorio (avería, merma, vencimiento, etc.).');
  }
}
