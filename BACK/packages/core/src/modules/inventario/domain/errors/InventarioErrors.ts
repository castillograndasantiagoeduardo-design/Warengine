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
