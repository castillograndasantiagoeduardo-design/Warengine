import type { ResultadoPaginado } from '@warengine/shared-kernel';
import { AlertaStock } from '../entities/AlertaStock.ts';

export interface FiltrosAlertasStock {
  /** Acota a estas sucursales. `undefined` = todas. */
  sucursalIds?: number[];
  page: number;
  limit: number;
}

export interface IAlertaStockRepository {
  /** Productos activos con stock_actual <= stock_minimo, los más críticos primero. */
  listar(filtros: FiltrosAlertasStock): Promise<ResultadoPaginado<AlertaStock>>;
}