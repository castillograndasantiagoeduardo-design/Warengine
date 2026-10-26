'use client';

/**
 * useInventoryMovements.ts — Hook para la gestión operativa de movimientos de almacén.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Centraliza la lógica de mutación de stock
 *   (entradas, bajas manuales, conteos físicos y auditoría en Kardex).
 * - Dependency Inversion Principle (DIP): Se desacopla a través de IBranchInventoryService.
 */

import { useState, useCallback } from 'react';
import { branchInventoryService } from '../api/branch-inventory.service';
import type { IBranchInventoryService } from '../api/branch-inventory.interface';
import type {
  RegistrarEntradaDTO,
  RegistrarSalidaDTO,
  AjustarInventarioDTO,
  FiltrosKardexDTO,
  ResultadoKardexPaginado,
  MovimientoKardexItem,
} from '../types/branch-inventory.types';

export function useInventoryMovements(
  inventoryService: IBranchInventoryService = branchInventoryService,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKardexLoading, setIsKardexLoading] = useState(false);
  const [kardexData, setKardexData] = useState<ResultadoKardexPaginado>({
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * RF-ADM-B7: Registrar entrada de mercancía formal a la sede.
   */
  const registrarEntrada = useCallback(
    async (dto: RegistrarEntradaDTO): Promise<{ ok: boolean; error?: string; data?: any }> => {
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        const res = await inventoryService.registrarEntrada(dto);
        return { ok: true, data: res };
      } catch (err: any) {
        const msg = err?.message || 'Error al asentar la entrada de mercancía.';
        setErrorMsg(msg);
        return { ok: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [inventoryService],
  );

  /**
   * RF-ADM-B8: Registrar salida manual justificada (merma, avería, rotura).
   */
  const registrarSalida = useCallback(
    async (dto: RegistrarSalidaDTO): Promise<{ ok: boolean; error?: string; data?: any }> => {
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        const res = await inventoryService.registrarSalida(dto);
        return { ok: true, data: res };
      } catch (err: any) {
        const msg = err?.message || 'Error al procesar la salida de almacén.';
        setErrorMsg(msg);
        return { ok: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [inventoryService],
  );

  /**
   * RF-ADM-B17: Ajustar inventario tras conteo físico directo en sede.
   */
  const ajustarInventario = useCallback(
    async (dto: AjustarInventarioDTO): Promise<{ ok: boolean; error?: string; data?: any }> => {
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        const res = await inventoryService.ajustarInventario(dto);
        return { ok: true, data: res };
      } catch (err: any) {
        const msg = err?.message || 'Error al aplicar el ajuste de inventario.';
        setErrorMsg(msg);
        return { ok: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [inventoryService],
  );

  /**
   * RF-ADM-B10: Consultar historial cronológico inmutable (Kardex).
   */
  const consultarKardex = useCallback(
    async (filtros: FiltrosKardexDTO): Promise<ResultadoKardexPaginado> => {
      setIsKardexLoading(true);
      setErrorMsg(null);
      try {
        const res = await inventoryService.consultarKardex(filtros);
        setKardexData(res);
        return res;
      } catch (err: any) {
        const msg = err?.message || 'Error al consultar movimientos de Kardex.';
        setErrorMsg(msg);
        return { items: [], total: 0, limit: 20, offset: 0 };
      } finally {
        setIsKardexLoading(false);
      }
    },
    [inventoryService],
  );

  /**
   * RF-ADM-B21: Descargar archivo CSV de movimientos Kardex.
   */
  const exportarCsv = useCallback(
    async (filtros?: {
      productoId?: string;
      sucursalId?: number;
      tipo?: string;
      desde?: string;
      hasta?: string;
    }) => {
      try {
        const blob = await inventoryService.descargarKardexCsv(filtros);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kardex_sede_${filtros?.sucursalId || 'actual'}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err: any) {
        setErrorMsg(err?.message || 'No fue posible descargar el reporte CSV de Kardex.');
      }
    },
    [inventoryService],
  );

  /**
   * RF-ADM-B16: Anular una entrada de mercancía con movimiento compensatorio.
   */
  const anularEntrada = useCallback(
    async (id: string, motivo: string): Promise<{ ok: boolean; error?: string }> => {
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        await inventoryService.anularEntrada(id, motivo);
        return { ok: true };
      } catch (err: any) {
        const msg = err?.message || 'No se pudo anular la entrada de mercancía.';
        setErrorMsg(msg);
        return { ok: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [inventoryService],
  );

  return {
    isSubmitting,
    isKardexLoading,
    kardexData,
    errorMsg,
    registrarEntrada,
    registrarSalida,
    ajustarInventario,
    consultarKardex,
    exportarCsv,
    anularEntrada,
  };
}
