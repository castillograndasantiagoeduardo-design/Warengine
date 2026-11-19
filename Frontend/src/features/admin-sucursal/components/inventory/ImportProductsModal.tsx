'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type { ReporteImportacionProductos } from '../../types/branch-inventory.types';

interface ImportProductsModalProps {
  open: boolean;
  onClose: () => void;
  onImportacionCompletada: () => void;
}

export function ImportProductsModal({
  open,
  onClose,
  onImportacionCompletada,
}: ImportProductsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ReporteImportacionProductos | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setIsDragging(false);
    setIsSubmitting(false);
    setErrorLocal(null);
    setResultado(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validarArchivo = (f: File): boolean => {
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv' && f.type !== 'application/vnd.ms-excel') {
      setErrorLocal('El archivo debe tener extensión .csv');
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErrorLocal('El archivo excede el tamaño máximo permitido (5MB)');
      return false;
    }
    setErrorLocal(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && validarArchivo(selected)) {
      setFile(selected);
      setResultado(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && validarArchivo(dropped)) {
      setFile(dropped);
      setResultado(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDescargarPlantilla = () => {
    const headers = 'sku,nombre,descripcion,categoria_id,proveedor_id,precio_compra,precio_venta,precio_corporativo,stock_minimo\n';
    const ejemplo1 = 'PROD-001,Arroz Diana 500g,Arroz blanco grano largo,1,1,3200,4200,3800,20\n';
    const ejemplo2 = 'PROD-002,Aceite Girasol 1L,Aceite vegetal 1 litro,2,1,10500,13800,12500,15\n';
    const blob = new Blob([headers + ejemplo1 + ejemplo2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_importacion_productos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorLocal('Selecciona un archivo CSV para importar.');
      return;
    }

    setIsSubmitting(true);
    setErrorLocal(null);
    try {
      const rep = await branchInventoryService.importarProductosCsv(file);
      setResultado(rep);
      onImportacionCompletada();
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al procesar el archivo CSV.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importar catálogo de productos (CSV)"
      description="Carga masiva de productos mediante archivo delimitado por comas."
      size="lg"
      locked={isSubmitting}
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleDescargarPlantilla}
            className="text-xs text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
          >
            Descargar plantilla de ejemplo
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              {resultado ? 'Finalizar' : 'Cancelar'}
            </button>
            {!resultado && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!file || isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-rose-500/20"
              >
                {isSubmitting ? 'Importando...' : 'Iniciar importación'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Zona Drag & Drop */}
        {!resultado && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-rose-500 bg-rose-500/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-white/15 hover:border-white/30 bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center text-white/60">
              📁
            </div>
            {file ? (
              <div>
                <p className="text-sm font-semibold text-emerald-400">{file.name}</p>
                <p className="text-xs text-white/50 mt-1">
                  {(file.size / 1024).toFixed(1)} KB · Clic para seleccionar otro archivo
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-white/80 font-medium">
                  Arrastra aquí tu archivo .CSV o haz clic para seleccionarlo
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Formato CSV codificado en UTF-8, hasta 5MB.
                </p>
              </div>
            )}
          </div>
        )}

        {errorLocal && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorLocal}
          </div>
        )}

        {/* Resumen del Resultado */}
        {resultado && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="vidrio rounded-xl p-3 text-center">
                <span className="text-[11px] text-white/50 uppercase">Procesadas</span>
                <p className="text-xl font-bold font-mono text-white mt-0.5">
                  {resultado.totalFilas}
                </p>
              </div>
              <div className="vidrio rounded-xl p-3 text-center">
                <span className="text-[11px] text-emerald-400/80 uppercase">Cargadas</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {resultado.totalCargados}
                </p>
              </div>
              <div className="vidrio rounded-xl p-3 text-center">
                <span className="text-[11px] text-red-400/80 uppercase">Rechazadas</span>
                <p className="text-xl font-bold font-mono text-red-400 mt-0.5">
                  {resultado.totalRechazados}
                </p>
              </div>
            </div>

            {resultado.filas && resultado.filas.filter((f) => f.estado === 'rechazado').length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-red-400">
                  Filas con observaciones ({resultado.totalRechazados}):
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-red-500/20 bg-red-500/5 divide-y divide-red-500/10 text-xs">
                  {resultado.filas
                    .filter((f) => f.estado === 'rechazado')
                    .map((err, idx) => (
                      <div key={idx} className="p-2.5 flex items-start gap-2 text-red-200">
                        <span className="font-mono font-bold text-red-400 whitespace-nowrap">
                          Fila {err.fila}:
                        </span>
                        <span>{err.motivo || 'Fila rechazada'}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center font-medium">
                ¡Todos los registros fueron importados exitosamente sin errores!
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
