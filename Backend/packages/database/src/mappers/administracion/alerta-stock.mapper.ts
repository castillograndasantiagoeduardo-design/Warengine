import { AlertaStock } from '@warengine/core';

export interface FilaAlertaStock {
  productoId: string;
  sku: string;
  nombre: string;
  sucursalId: number;
  sucursalNombre: string;
  stockActual: number;
  stockMinimo: number;
}

export function alertaStockFromRow(row: FilaAlertaStock): AlertaStock {
  return new AlertaStock(
    row.productoId,
    row.sku,
    row.nombre,
    row.sucursalId,
    row.sucursalNombre,
    row.stockActual,
    row.stockMinimo,
  );
}