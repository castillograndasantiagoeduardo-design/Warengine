/**
 * Sku — Value Object para el código SKU de un producto.
 * Preserva mayúsculas/minúsculas exactas (COLLATE utf8mb4_bin).
 */
export class Sku {
  private readonly _valor: string;

  constructor(valor: string) {
    const trimmed = valor?.trim();
    if (!trimmed || trimmed.length === 0) {
      throw new Error('El SKU no puede estar vacío.');
    }
    if (trimmed.length > 50) {
      throw new Error('El SKU no puede tener más de 50 caracteres.');
    }
    this._valor = trimmed;
  }

  get valor(): string {
    return this._valor;
  }

  public equals(other: Sku): boolean {
    return this._valor === other._valor;
  }

  public toString(): string {
    return this._valor;
  }
}
