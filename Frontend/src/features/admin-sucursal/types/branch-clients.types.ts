import type {
  ClienteDto,
  ResumenClientesDto,
  ClientesPaginadosDto,
  CrearClienteInput,
  ActualizarClienteInput,
  FiltrosClientesInput,
} from '@warengine/contracts';

export type {
  ClienteDto,
  ResumenClientesDto,
  ClientesPaginadosDto,
  CrearClienteInput,
  ActualizarClienteInput,
  FiltrosClientesInput,
};

export interface FiltrosClientesState {
  texto?: string;
  tipoCliente?: 'B2C' | 'B2B';
  creditoHabilitado?: boolean;
  estado?: 'activo' | 'inactivo';
  page: number;
  limite: number;
}

/**
 * Identifica si un cliente corresponde al cliente genérico del sistema
 * ("Consumidor Final" o documento 222222222222).
 */
export function esClienteGenerico(cliente: {
  numeroDocumento?: string | null;
  nombreRazonSocial?: string | null;
}): boolean {
  if (!cliente) return false;
  const doc = (cliente.numeroDocumento || '').trim();
  const nombre = (cliente.nombreRazonSocial || '').trim().toLowerCase();
  return doc === '222222222222' || nombre === 'consumidor final';
}

/**
 * Evalúa el estado del crédito y devuelve el tono visual.
 * - verde: crédito habilitado con saldo bajo o sin uso
 * - ámbar: uso de crédito moderado/alto
 * - rojo: alto compromiso de crédito
 * - gris: sin crédito corporativo
 */
export function obtenerNivelCredito(
  creditoHabilitado: boolean,
  saldoPendiente: number = 0,
): {
  color: 'verde' | 'ambar' | 'rojo' | 'gris';
  etiqueta: string;
} {
  if (!creditoHabilitado) {
    return { color: 'gris', etiqueta: 'Sin crédito' };
  }
  if (saldoPendiente <= 0) {
    return { color: 'verde', etiqueta: 'Al día' };
  }
  if (saldoPendiente > 5000000) {
    return { color: 'rojo', etiqueta: 'Saldo alto' };
  }
  return { color: 'ambar', etiqueta: 'Con saldo' };
}
