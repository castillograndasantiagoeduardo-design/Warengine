'use client';

/**
 * useExportarAuditoria.ts — Descarga en CSV de la bitácora con los filtros aplicados (RF-ADM-C20).
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { aFechaISO } from '@/lib/format/fecha';
import { mensajeDeError } from '@/lib/forms/validacion';
import { auditoriaService } from '../api';
import type { FiltrosAuditoria } from '../types';

export function useExportarAuditoria() {
  const toast = useToast();
  const [exportando, setExportando] = useState(false);

  const exportar = useCallback(
    async (filtros: FiltrosAuditoria) => {
      setExportando(true);
      try {
        const csv = await auditoriaService.exportarCsv(filtros);
        // BOM para que Excel reconozca UTF-8 (tildes y ñ)
        const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `auditoria-${aFechaISO()}.csv`;
        enlace.click();
        URL.revokeObjectURL(url);
        toast.success('Exportación lista: se descargó el archivo CSV.');
      } catch (error) {
        toast.error(mensajeDeError(error));
      } finally {
        setExportando(false);
      }
    },
    [toast],
  );

  return { exportando, exportar };
}
