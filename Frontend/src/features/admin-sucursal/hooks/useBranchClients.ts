'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  ClienteDto,
  ResumenClientesDto,
  CrearClienteInput,
  ActualizarClienteInput,
  FiltrosClientesState,
} from '../types/branch-clients.types';
import { branchClientsService } from '../api/branch-clients.service';
import type { FacturaDto } from '@warengine/contracts';

const RESUMEN_INICIAL: ResumenClientesDto = {
  total: 0,
  b2b: 0,
  b2c: 0,
  conCredito: 0,
  saldoPendienteTotal: 0,
};

export function useBranchClients(filtros: FiltrosClientesState) {
  const [datos, setDatos] = useState<ClienteDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [resumen, setResumen] = useState<ResumenClientesDto>(RESUMEN_INICIAL);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await branchClientsService.listarClientes(filtros);
      setDatos(res.items || res.clientes || []);
      setTotal(res.total);
      setTotalPaginas(res.totalPaginas);
      if (res.resumen) {
        setResumen(res.resumen);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar clientes.');
    } finally {
      setCargando(false);
    }
  }, [
    filtros.page,
    filtros.limite,
    filtros.texto,
    filtros.tipoCliente,
    filtros.creditoHabilitado,
    filtros.estado,
  ]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crearCliente = useCallback(
    async (input: CrearClienteInput) => {
      const res = await branchClientsService.crearCliente(input);
      await cargar();
      return res;
    },
    [cargar],
  );

  const actualizarCliente = useCallback(
    async (id: string, input: ActualizarClienteInput) => {
      const res = await branchClientsService.actualizarCliente(id, input);
      await cargar();
      return res;
    },
    [cargar],
  );

  const gestionarCredito = useCallback(
    async (id: string, creditoHabilitado: boolean) => {
      const res = await branchClientsService.gestionarCredito(id, creditoHabilitado);
      await cargar();
      return res;
    },
    [cargar],
  );

  const obtenerUltimasFacturas = useCallback(
    async (clienteId: string, limite = 5): Promise<FacturaDto[]> => {
      return await branchClientsService.obtenerUltimasFacturas(clienteId, limite);
    },
    [],
  );

  return {
    datos,
    total,
    totalPaginas,
    resumen,
    cargando,
    error,
    recargar: cargar,
    crearCliente,
    actualizarCliente,
    gestionarCredito,
    obtenerUltimasFacturas,
  };
}
