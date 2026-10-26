'use client';

/**
 * usePosClientes.ts — Hook para búsqueda, selección y registro ágil de clientes en el POS.
 */

import { useState, useEffect, useCallback } from 'react';
import { posService } from '../api';
import type { ClienteDto, CrearClienteInput } from '../types/pos.types';

export function usePosClientes() {
  // Sin cliente por defecto: el cajero busca o crea el cliente real de cada venta
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const [clientesEncontrados, setClientesEncontrados] = useState<ClienteDto[]>([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [isBuscando, setIsBuscando] = useState<boolean>(false);
  const [isCreando, setIsCreando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const limpiarCliente = useCallback(() => {
    setClienteSeleccionado(null);
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
    limpiarCliente,
    crearClienteRapido,
  };
}
