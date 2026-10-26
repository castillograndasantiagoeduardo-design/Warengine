'use client';

/**
 * useBranchInvoicing.ts — Hook para supervisión de facturas y alertas operativas de cajeros.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Gestión de estado de facturación, anulaciones y alertas.
 * - Dependency Inversion Principle (DIP): Inyección mediante IBranchInvoicingService.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { branchInvoicingService } from '../api/branch-invoicing.service';
import type { IBranchInvoicingService } from '../api/branch-invoicing.interface';
import type {
  FacturaSede,
  AlertaOperativa,
  EstadoFacturaSede,
} from '../types/branch-invoicing.types';

interface UseBranchInvoicingOptions {
  sucursalId: number;
}

export function useBranchInvoicing(
  options: UseBranchInvoicingOptions,
  invoicingService: IBranchInvoicingService = branchInvoicingService,
) {
  const { sucursalId } = options;
  const [facturas, setFacturas] = useState<FacturaSede[]>([]);
  const [alertas, setAlertas] = useState<AlertaOperativa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros reactivos
  const [tabActiva, setTabActiva] = useState<'facturas' | 'alertas'>('facturas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'emitida' | 'anulada'>('todas');
  const [filtroPrioridadAlerta, setFiltroPrioridadAlerta] = useState<'todas' | 'urgente' | 'normal'>('todas');
  const [filtroEstadoAlerta, setFiltroEstadoAlerta] = useState<'todas' | 'pendiente' | 'atendido'>('todas');

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [facRes, alertRes] = await Promise.allSettled([
        invoicingService.listarFacturas(sucursalId),
        invoicingService.listarAlertas(sucursalId),
      ]);

      if (facRes.status === 'fulfilled') {
        setFacturas(facRes.value);
      } else {
        console.error('[useBranchInvoicing] Error cargando facturas:', facRes.reason);
      }

      if (alertRes.status === 'fulfilled') {
        setAlertas(alertRes.value);
      } else {
        console.error('[useBranchInvoicing] Error cargando alertas:', alertRes.reason);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al consultar operaciones de facturación.');
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId, invoicingService]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Anulación administrativa atómica con reposición de inventario (RF-FMC-E10)
  const anularFactura = async (
    id: string,
    motivo: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsMutating(true);
    try {
      const res = await invoicingService.anularFactura(id, motivo);
      setFacturas((prev) =>
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

  // Resolución de alerta de mostrador (RF-FMC-F1..F8)
  const marcarAlerta = async (
    id: string,
    estado: 'visto' | 'atendido',
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsMutating(true);
    try {
      const res = await invoicingService.cambiarEstadoAlerta(id, estado);
      setAlertas((prev) =>
        prev.map((a) => (a.id === id ? res : a)),
      );
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Error al actualizar el estado de la alerta.',
      };
    } finally {
      setIsMutating(false);
    }
  };

  // Filtrado de facturas en memoria
  const facturasFiltradas = useMemo(() => {
    return facturas.filter((fac) => {
      if (filtroEstado !== 'todas' && fac.estado !== filtroEstado) return false;

      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim();
        const matchFolio = fac.folioFormateado.toLowerCase().includes(term);
        const matchConsecutivo = String(fac.consecutivo).includes(term);
        const matchCliente = (fac.clienteNombre || '').toLowerCase().includes(term);
        const matchDoc = (fac.clienteDocumento || '').toLowerCase().includes(term);
        const matchCajero = (fac.cajeroNombre || '').toLowerCase().includes(term);
        return matchFolio || matchConsecutivo || matchCliente || matchDoc || matchCajero;
      }

      return true;
    });
  }, [facturas, filtroEstado, busqueda]);

  // Filtrado de alertas en memoria
  const alertasFiltradas = useMemo(() => {
    return alertas.filter((alt) => {
      if (filtroPrioridadAlerta !== 'todas' && alt.prioridad !== filtroPrioridadAlerta) return false;
      if (filtroEstadoAlerta !== 'todas') {
        if (filtroEstadoAlerta === 'pendiente' && alt.estado === 'atendido') return false;
        if (filtroEstadoAlerta === 'atendido' && alt.estado !== 'atendido') return false;
      }
      return true;
    });
  }, [alertas, filtroPrioridadAlerta, filtroEstadoAlerta]);

  // Métricas calculadas sobre datos verídicos
  const kpis = useMemo(() => {
    const facturasEmitidas = facturas.filter((f) => f.estado === 'emitida');
    const totalVentas = facturasEmitidas.reduce((acc, f) => acc + f.total, 0);
    const facturasAnuladasCount = facturas.filter((f) => f.estado === 'anulada').length;
    const alertasPendientesCount = alertas.filter((a) => a.estado !== 'atendido').length;
    const alertasUrgentesCount = alertas.filter((a) => a.estado !== 'atendido' && a.prioridad === 'urgente').length;

    return {
      totalVentas,
      totalFacturas: facturas.length,
      totalEmitidas: facturasEmitidas.length,
      totalAnuladas: facturasAnuladasCount,
      totalAlertasPendientes: alertasPendientesCount,
      totalAlertasUrgentes: alertasUrgentesCount,
    };
  }, [facturas, alertas]);

  return {
    facturas: facturasFiltradas,
    alertas: alertasFiltradas,
    totalFacturasOriginal: facturas.length,
    totalAlertasOriginal: alertas.length,
    kpis,
    tabActiva,
    setTabActiva,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    filtroPrioridadAlerta,
    setFiltroPrioridadAlerta,
    filtroEstadoAlerta,
    setFiltroEstadoAlerta,
    isLoading,
    isMutating,
    error,
    recargar: cargarDatos,
    anularFactura,
    marcarAlerta,
  };
}
