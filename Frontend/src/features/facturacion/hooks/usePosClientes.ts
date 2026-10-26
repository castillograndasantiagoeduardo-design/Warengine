'use client';

/**
 * usePosClientes.ts — Hook para búsqueda, selección y registro ágil de clientes en el POS.
 */

import { useState, useEffect, useCallback } from 'react';
import { posService } from '../api';
import type { ClienteDto, CrearClienteInput } from '../types/pos.types';

// Cliente consumidor final por defecto para venta rápida de mostrador
export const CLIENTE_CONSUMIDOR_FINAL_DEFAULT: ClienteDto = {
  id: 'CONSUMIDOR_FINAL',
  tipoDocumento: 'CC',
  numeroDocumento: '222222222222',
  nombreRazonSocial: 'Consumidor Final',
  tipoCliente: 'B2C',
  email: null,
  telefono: null,
  direccion: null,
  creditoHabilitado: false,
};

export function usePosClientes() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto>(CLIENTE_CONSUMIDOR_FINAL_DEFAULT);
  const [clientesEncontrados, setClientesEncontrados] = useState<ClienteDto[]>([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [isBuscando, setIsBuscando] = useState<boolean>(false);
  const [isCreando, setIsCreando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Asegura que exista el cliente consumidor final en el backend o selecciona el default
   */
  useEffect(() => {
    let montado = true;
    async function asegurarConsumidorFinal() {
      try {
        const encontrados = await posService.buscarClientes('222222222222');
        if (montado && encontrados.length > 0) {
          setClienteSeleccionado(encontrados[0]);
        }
      } catch {
        // Mantiene el fallback local si hay algún problema transitorio
      }
    }
    asegurarConsumidorFinal();
    return () => {
      montado = false;
    };
  }, []);

  /**
   * Búsqueda en tiempo real con debounce
   */
  useEffect(() => {
    if (!terminoBusqueda.trim() || terminoBusqueda.trim().length < 2) {
      setClientesEncontrados([]);
      setIsBuscando(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsBuscando(true);
      setError(null);
      try {
        const resultados = await posService.buscarClientes(terminoBusqueda.trim());
        setClientesEncontrados(resultados);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al buscar clientes.');
      } finally {
        setIsBuscando(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [terminoBusqueda]);

  const seleccionarCliente = useCallback((cliente: ClienteDto) => {
    setClienteSeleccionado(cliente);
    setTerminoBusqueda('');
    setClientesEncontrados([]);
  }, []);

  const restablecerConsumidorFinal = useCallback(() => {
    setClienteSeleccionado(CLIENTE_CONSUMIDOR_FINAL_DEFAULT);
    setTerminoBusqueda('');
    setClientesEncontrados([]);
  }, []);

  const crearClienteRapido = async (input: CrearClienteInput): Promise<ClienteDto> => {
    setIsCreando(true);
    setError(null);
    try {
      const res = await posService.crearCliente(input);
      setClienteSeleccionado(res.cliente);
      setTerminoBusqueda('');
      setClientesEncontrados([]);
      return res.cliente;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar cliente.';
      setError(msg);
      throw err;
    } finally {
      setIsCreando(false);
    }
  };

  return {
    clienteSeleccionado,
    clientesEncontrados,
    terminoBusqueda,
    setTerminoBusqueda,
    isBuscando,
    isCreando,
    error,
    seleccionarCliente,
    restablecerConsumidorFinal,
    crearClienteRapido,
  };
}
