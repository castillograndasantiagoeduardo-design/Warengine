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
  constructor(disponibleOMensaje?: number | string, solicitado?: number) {
    if (typeof disponibleOMensaje === 'number' && typeof solicitado === 'number') {
      super(`Stock insuficiente. Disponible: ${disponibleOMensaje}, solicitado: ${solicitado}.`);
    } else if (typeof disponibleOMensaje === 'string') {
      super(disponibleOMensaje);
    } else {
      super('Stock insuficiente para completar la venta de este producto.');
    }
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

export class StockMinimoInvalidoError extends DomainError {
  public readonly code = 'STOCK_MINIMO_INVALIDO';
  constructor(mensaje: string = 'El stock mínimo debe ser un número entero mayor o igual a cero.') {
    super(mensaje);
  }
}

export class EntradaNoEncontradaError extends DomainError {
  public readonly code = 'ENTRADA_NO_ENCONTRADA';
  constructor() {
    super('La entrada de mercancía especificada no existe.');
  }
}

export class EntradaYaAnuladaError extends DomainError {
  public readonly code = 'ENTRADA_YA_ANULADA';
  constructor() {
    super('Esta entrada de mercancía ya ha sido anulada previamente.');
  }
}

export class MotivoAnulacionRequeridoError extends DomainError {
  public readonly code = 'MOTIVO_ANULACION_REQUERIDO';
  constructor() {
    super('El motivo de anulación es obligatorio (mínimo 5 caracteres).');
  }
}

export class MotivoAjusteRequeridoError extends DomainError {
  public readonly code = 'MOTIVO_AJUSTE_REQUERIDO';
  constructor() {
    super('El motivo del ajuste de inventario es obligatorio (mínimo 5 caracteres).');
  }
}

export class StockFisicoInvalidoError extends DomainError {
  public readonly code = 'STOCK_FISICO_INVALIDO';
  constructor() {
    super('El stock físico debe ser un número entero mayor o igual a cero.');
  }
}

export class SucursalesTransferenciaIgualesError extends DomainError {
  public readonly code = 'SUCURSALES_TRANSFERENCIA_IGUALES';
  constructor() {
    super('La sucursal de origen y destino no pueden ser la misma.');
  }
}

/**
 * RF-ADM-B19: Restricción de inactivación de categorías con productos activos vinculados.
 */
export class CategoriaConProductosActivosError extends DomainError {
  public readonly code = 'CATEGORIA_CON_PRODUCTOS_ACTIVOS';
  constructor(cantidad?: number) {
    super(
      cantidad !== undefined
        ? `No se puede inactivar la categoría porque tiene ${cantidad} producto(s) activo(s) asociado(s). Reasigne o inactive dichos productos previamente.`
        : 'No se puede inactivar la categoría porque tiene productos activos asociados. Reasigne o inactive dichos productos previamente.',
    );
  }
}

/**
 * RF-ADM-B19: Restricción de inactivación de proveedores con productos activos vinculados.
 */
export class ProveedorConProductosActivosError extends DomainError {
  public readonly code = 'PROVEEDOR_CON_PRODUCTOS_ACTIVOS';
  constructor(cantidad?: number) {
    super(
      cantidad !== undefined
        ? `No se puede inactivar el proveedor porque tiene ${cantidad} producto(s) activo(s) asociado(s). Reasigne o inactive dichos productos previamente.`
        : 'No se puede inactivar el proveedor porque tiene productos activos asociados. Reasigne o inactive dichos productos previamente.',
    );
  }
}





