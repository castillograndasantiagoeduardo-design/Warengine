import { DomainError } from '@warengine/shared-kernel';

export class DatosClienteB2BIncompletosError extends DomainError {
  public readonly code = 'CLIENTE_B2B_DATOS_INCOMPLETOS';
  constructor() {
    super('Un cliente B2B requiere dirección y teléfono.');
  }
}

export class ClienteNoEncontradoError extends DomainError {
  public readonly code = 'CLIENTE_NO_ENCONTRADO';
  constructor() {
    super('El cliente no existe.');
  }
}

export class DocumentoClienteYaRegistradoError extends DomainError {
  public readonly code = 'DOCUMENTO_CLIENTE_YA_REGISTRADO';
  constructor() {
    super('Ya existe un cliente con ese tipo y número de documento.');
  }
}

export class CreditoNoHabilitadoError extends DomainError {
  public readonly code = 'CREDITO_NO_HABILITADO';
  constructor() {
    super('Este cliente no tiene crédito corporativo habilitado.');
  }
}

export class FacturacionSinTurnoAbiertoError extends DomainError {
  public readonly code = 'FACTURACION_SIN_TURNO_ABIERTO';
  constructor() {
    super('El cajero debe tener un turno de caja abierto para facturar en mostrador.');
  }
}

export class PagoInvalidoError extends DomainError {
  public readonly code = 'PAGO_INVALIDO';
  constructor(mensaje: string = 'La suma de los pagos no coincide con el total de la factura.') {
    super(mensaje);
  }
}

export class ClienteRequeridoParaVentaB2BError extends DomainError {
  public readonly code = 'CLIENTE_REQUERIDO_B2B';
  constructor(mensaje: string = 'La venta B2B requiere un cliente corporativo (B2B).') {
    super(mensaje);
  }
}

export class FacturaNoEncontradaError extends DomainError {
  public readonly code = 'FACTURA_NO_ENCONTRADA';
  constructor() {
    super('La factura no existe.');
  }
}

export class MotivoAnulacionFacturaRequeridoError extends DomainError {
  public readonly code = 'MOTIVO_ANULACION_FACTURA_REQUERIDO';
  constructor() {
    super('El motivo de anulación de la factura es obligatorio (mínimo 5 caracteres).');
  }
}

export class FacturaYaAnuladaError extends DomainError {
  public readonly code = 'FACTURA_YA_ANULADA';
  constructor() {
    super('La factura ya fue anulada.');
  }
}

export class FacturaAnuladaError extends DomainError {
  public readonly code = 'FACTURA_ANULADA';
  constructor() { super('No se puede registrar una devolución sobre una factura anulada.'); }
}
export class ItemFacturaNoEncontradoError extends DomainError {
  public readonly code = 'ITEM_FACTURA_NO_ENCONTRADO';
  constructor() { super('La línea indicada no pertenece a la factura.'); }
}
export class CantidadDevolucionExcedidaError extends DomainError {
  public readonly code = 'CANTIDAD_DEVOLUCION_EXCEDIDA';
  constructor(mensaje = 'La cantidad devuelta supera la cantidad vendida en esa línea.') { super(mensaje); }
}
export class DevolucionInvalidaError extends DomainError {
  public readonly code = 'DEVOLUCION_INVALIDA';
  constructor(mensaje = 'La devolución no es válida.') { super(mensaje); }
}
