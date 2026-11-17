'use client';

/**
 * useBranchInvoicing.ts — Hook para supervisión reactiva de facturas paginadas y operaciones.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Encapsula la orquestación del estado de facturas,
 *   filtros del servidor, paginación, anulación y devoluciones.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/autenticacion';
import { branchInvoicingService } from '../api/branch-invoicing.service';
import type { IBranchInvoicingService } from '../api/branch-invoicing.interface';
import type {
  FacturaSede,
  FiltrosFacturasSede,
  RegistrarDevolucionPayload,
} from '../types/branch-invoicing.types';

export function useBranchInvoicing(
  filtros: FiltrosFacturasSede,
  invoicingService: IBranchInvoicingService = branchInvoicingService,
) {
  const { usuario } = useAuth();
  const sucursalId = usuario?.sucursalId || 1;

  const [datos, setDatos] = useState<FacturaSede[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [page, setPage] = useState<number>(filtros.page ?? 1);
  const [limite, setLimite] = useState<number>(filtros.limite ?? 10);
  const [cargando, setCargando] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarFacturas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await invoicingService.listarFacturas(sucursalId, filtros);
      setDatos(res.items);
      setTotal(res.total);
      setTotalPaginas(res.totalPaginas);
      setPage(res.page);
      setLimite(res.limite);
    } catch (err: any) {
      console.error('[useBranchInvoicing] Error al consultar facturas:', err);
      setError(err?.message || 'Error al consultar operaciones de facturación.');
      setDatos([]);
      setTotal(0);
      setTotalPaginas(1);
    } finally {
      setCargando(false);
    }
  }, [
    sucursalId,
    filtros.page,
    filtros.limite,
    filtros.estado,
    filtros.tipo,
    filtros.texto,
    filtros.desde,
    filtros.hasta,
    invoicingService,
  ]);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  const anularFactura = async (
    id: string,
    motivo: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsMutating(true);
    try {
      const res = await invoicingService.anularFactura(id, motivo);
      setDatos((prev) =>
        prev.map((f) => (f.id === id ? res.factura : f)),
      );
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'No fue posible anular la factura.',
      };
    } finally {
      setIsMutating(false);
    }
  };

  const registrarDevolucion = async (
    id: string,
    payload: RegistrarDevolucionPayload,
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsMutating(true);
    try {
      await invoicingService.registrarDevolucion(id, payload);
      await cargarFacturas();
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'No fue posible registrar la devolución.',
      };
    } finally {
      setIsMutating(false);
    }
  };

  return {
    datos,
    total,
    totalPaginas,
    page,
    limite,
    cargando,
    isMutating,
    error,
    recargar: cargarFacturas,
    anularFactura,
    registrarDevolucion,
  };
}
