'use client';

/**
 * SelectorPaleta.tsx — Panel de Apariencia del Dashboard de WarEngine.
 *
 * Popover compacto en una sola vista sin pestañas:
 * 1. MODO: Oscuro / Claro
 * 2. TEMAS: Cuadrícula 3 cols con los 11 temas oficiales
 * 3. EFECTO DE FONDO: Orbes difusos / Aurora ambiental / Retícula + luz
 * 4. PERSONALIZAR COLORES (AVANZADO): Acordeón colapsable cerrado por defecto
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  CATALOGO_COLORES_ACENTO,
  CATALOGO_COLORES_FONDO,
  generarVariablesCss,
  aplicarPaletaPersonalizada,
  limpiarPaletaPersonalizada,
  type VariablesPersonalizadas,
} from '@/lib/generadorPaleta';

export interface TemaInfo {
  id: string;
  nombre: string;
  m1: string;
  m2: string;
  m3: string;
}

export const TEMAS_OFICIALES: TemaInfo[] = [
  { id: 'zafiro', nombre: 'Zafiro', m1: '#3b6cf2', m2: '#4f46e5', m3: '#06b6d4' },
  { id: 'acero', nombre: 'Acero Corporativo', m1: '#3b82f6', m2: '#475569', m3: '#0284c7' },
  { id: 'grafito', nombre: 'Grafito', m1: '#64748b', m2: '#475569', m3: '#1e3a8a' },
  { id: 'indigo', nombre: 'Índigo', m1: '#6366f1', m2: '#4338ca', m3: '#1d4ed8' },
  { id: 'petroleo', nombre: 'Petróleo', m1: '#0284c7', m2: '#0f766e', m3: '#1e3a8a' },
  { id: 'vino', nombre: 'Vino', m1: '#e11d48', m2: '#be123c', m3: '#334155' },
  { id: 'oro', nombre: 'Oro', m1: '#eab308', m2: '#d97706', m3: '#334155' },
  { id: 'violeta', nombre: 'Violeta', m1: '#8b5cf6', m2: '#7c3aed', m3: '#c026d3' },
  { id: 'cian', nombre: 'Cian', m1: '#22d3ee', m2: '#06b6d4', m3: '#0ea5e9' },
  { id: 'esmeralda', nombre: 'Esmeralda', m1: '#14b8a6', m2: '#10b981', m3: '#0ea5e9' },
  { id: 'cobre', nombre: 'Cobre', m1: '#f97316', m2: '#ea580c', m3: '#d97706' },
];

export function SelectorPaleta() {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<'dark' | 'light'>('dark');
  const [paletaActiva, setPaletaActiva] = useState<string>('zafiro');
  const [fondoActivo, setFondoActivo] = useState<string>('orbes');
  const [acordeonAbierto, setAcordeonAbierto] = useState(false);

  // Estado de colores personalizados
  const [customConfig, setCustomConfig] = useState<VariablesPersonalizadas>({
    acento: '#3b6cf2',
    fondo: '#070d1a',
    luz1: '#2551d6',
    luz2: '#4f46e5',
    luz3: '#06b6d4',
  });

  const refPopover = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const d = document.documentElement;
    const p = localStorage.getItem('warengine-paleta') || 'zafiro';
    const f = localStorage.getItem('warengine-fondo') || 'orbes';
    const m = (localStorage.getItem('warengine-tema') as 'dark' | 'light') || 'dark';

    setPaletaActiva(p);
    setFondoActivo(f);
    setModo(m);

    const savedVars = localStorage.getItem('warengine-paleta-custom-vars');
    if (savedVars) {
      try {
        const parsed = JSON.parse(savedVars);
        setCustomConfig((prev) => ({ ...prev, ...parsed }));
        if (p === 'personalizada') {
          aplicarPaletaPersonalizada(generarVariablesCss(parsed));
        }
      } catch {}
    }
  }, []);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (refPopover.current && !refPopover.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [abierto]);

  const cambiarModo = (nuevoModo: 'dark' | 'light') => {
    setModo(nuevoModo);
    const d = document.documentElement;
    if (nuevoModo === 'light') {
      d.classList.add('light');
      d.classList.remove('dark');
    } else {
      d.classList.add('dark');
      d.classList.remove('light');
    }
    localStorage.setItem('warengine-tema', nuevoModo);
  };

  const seleccionarTema = (id: string) => {
    setPaletaActiva(id);
    const d = document.documentElement;
    d.setAttribute('data-paleta', id);
    localStorage.setItem('warengine-paleta', id);

    if (id !== 'personalizada') {
      limpiarPaletaPersonalizada();
      localStorage.removeItem('warengine-paleta-custom-vars');
    }
  };

  const cambiarFondo = (idFondo: string) => {
    setFondoActivo(idFondo);
    document.documentElement.setAttribute('data-fondo', idFondo);
    localStorage.setItem('warengine-fondo', idFondo);
  };

  const actualizarColorCustom = (clave: keyof VariablesPersonalizadas, valor: string) => {
    const nuevo = { ...customConfig, [clave]: valor };
    setCustomConfig(nuevo);
    setPaletaActiva('personalizada');
    document.documentElement.setAttribute('data-paleta', 'personalizada');
    localStorage.setItem('warengine-paleta', 'personalizada');
    localStorage.setItem('warengine-paleta-custom-vars', JSON.stringify(nuevo));
    aplicarPaletaPersonalizada(generarVariablesCss(nuevo));
  };

  const restablecerTema = () => {
    seleccionarTema('zafiro');
    setCustomConfig({
      acento: '#3b6cf2',
      fondo: '#070d1a',
      luz1: '#2551d6',
      luz2: '#4f46e5',
      luz3: '#06b6d4',
    });
  };

  const temaActual = TEMAS_OFICIALES.find((t) => t.id === paletaActiva);
  const nombreActivo = paletaActiva === 'personalizada' ? 'Personalizado' : temaActual?.nombre || 'Zafiro';
  const dot1 = paletaActiva === 'personalizada' ? customConfig.acento : temaActual?.m1 || '#3b6cf2';
  const dot2 = paletaActiva === 'personalizada' ? customConfig.luz1 : temaActual?.m2 || '#4f46e5';

  return (
    <div className="relative inline-block" ref={refPopover}>
      {/* Botón Disparador en Barra Superior */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="superficie-control rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs font-medium cursor-pointer shadow-sm hover:border-border-hover transition-colors"
        title="Apariencia y temas del panel"
        aria-label="Abrir selector de apariencia"
      >
        <Palette className="w-3.5 h-3.5 text-brand-500" />
        <div className="flex items-center -space-x-1">
          <span className="w-2.5 h-2.5 rounded-full ring-1 ring-border" style={{ backgroundColor: dot1 }} />
          <span className="w-2.5 h-2.5 rounded-full ring-1 ring-border" style={{ backgroundColor: dot2 }} />
        </div>
        <span className="text-text font-sans hidden sm:inline">{nombreActivo}</span>
        <ChevronDown
          className={`w-3 h-3 text-text-muted transition-transform duration-150 ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Flotante de Una Sola Vista */}
      {abierto && (
        <div
          className="vidrio-popover !absolute right-0 mt-2 w-[320px] sm:w-[340px] p-3.5 z-[100] shadow-2xl rounded-2xl max-h-[460px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150 text-text"
          style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0 }}
        >
          <div className="space-y-3.5">
            {/* 1. MODO OSCURO / CLARO */}
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Modo
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface border border-border">
                <button
                  type="button"
                  onClick={() => cambiarModo('dark')}
                  className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    modo === 'dark'
                      ? 'bg-brand-600 text-btn-primario-texto shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Oscuro</span>
                </button>
                <button
                  type="button"
                  onClick={() => cambiarModo('light')}
                  className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    modo === 'light'
                      ? 'bg-brand-600 text-btn-primario-texto shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Claro</span>
                </button>
              </div>
            </div>

            {/* 2. TEMAS OFICIALES (Cuadrícula 3 cols sin descripciones) */}
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Temas
              </div>
              <div className="grid grid-cols-3 gap-1">
                {TEMAS_OFICIALES.map((t) => {
                  const estaActivo = paletaActiva === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => seleccionarTema(t.id)}
                      className={`relative flex flex-col items-center p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        estaActivo
                          ? 'border-brand-500 bg-brand-500/15 shadow-sm'
                          : 'border-border bg-surface hover:border-border-hover hover:bg-white/[0.04]'
                      }`}
                    >
                      {estaActivo && (
                        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-brand-500 text-btn-primario-texto flex items-center justify-center">
                          <Check className="w-2 h-2" />
                        </span>
                      )}
                      <div className="flex items-center -space-x-1 mb-1 mt-0.5">
                        <span className="w-2.5 h-2.5 rounded-full ring-1 ring-border" style={{ backgroundColor: t.m1 }} />
                        <span className="w-2.5 h-2.5 rounded-full ring-1 ring-border" style={{ backgroundColor: t.m2 }} />
                        <span className="w-2.5 h-2.5 rounded-full ring-1 ring-border" style={{ backgroundColor: t.m3 }} />
                      </div>
                      <span className="text-[10px] font-medium text-text truncate w-full">
                        {t.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. EFECTO DE FONDO */}
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                Efecto de fondo
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface border border-border">
                {[
                  { id: 'orbes', label: 'Orbes difusos' },
                  { id: 'aurora', label: 'Aurora ambiental' },
                  { id: 'reticula', label: 'Retícula + luz' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => cambiarFondo(f.id)}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-medium transition-all text-center truncate cursor-pointer ${
                      fondoActivo === f.id
                        ? 'bg-brand-600 text-btn-primario-texto shadow-sm'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. PERSONALIZAR COLORES (AVANZADO) - Acordeón cerrado por defecto */}
            <div className="border-t border-border/70 pt-3">
              <button
                type="button"
                onClick={() => setAcordeonAbierto(!acordeonAbierto)}
                className="w-full flex items-center justify-between py-1 text-xs font-medium text-text hover:text-brand-400 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Personalizar colores (Avanzado)
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                    acordeonAbierto ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {acordeonAbierto && (
                <div className="space-y-3.5 pt-3 animate-in fade-in duration-200">
                  {/* Selector 1: Color de Acento */}
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1.5">
                      Color de acento
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 mb-2">
                      {CATALOGO_COLORES_ACENTO.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => actualizarColorCustom('acento', c.hex)}
                          className="w-full h-6 rounded-md ring-1 ring-border relative transition-transform hover:scale-105 cursor-pointer"
                          style={{ backgroundColor: c.hex }}
                          title={c.nombre}
                        >
                          {customConfig.acento.toLowerCase() === c.hex.toLowerCase() && (
                            <Check className="w-3 h-3 text-white mx-auto drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customConfig.acento}
                        onChange={(e) => actualizarColorCustom('acento', e.target.value)}
                        className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                      />
                      <span className="text-[11px] font-mono text-text uppercase">
                        {customConfig.acento}
                      </span>
                    </div>
                  </div>

                  {/* Selector 2: Fondo */}
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1.5">
                      Fondo
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 mb-2">
                      {CATALOGO_COLORES_FONDO.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => actualizarColorCustom('fondo', c.hex)}
                          className="w-full h-6 rounded-md ring-1 ring-border relative transition-transform hover:scale-105 cursor-pointer"
                          style={{ backgroundColor: c.hex }}
                          title={c.nombre}
                        >
                          {customConfig.fondo.toLowerCase() === c.hex.toLowerCase() && (
                            <Check className="w-3 h-3 text-white mx-auto drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customConfig.fondo}
                        onChange={(e) => actualizarColorCustom('fondo', e.target.value)}
                        className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                      />
                      <span className="text-[11px] font-mono text-text uppercase">
                        {customConfig.fondo}
                      </span>
                    </div>
                  </div>

                  {/* Brillos (Luz 1, 2, 3) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-text-muted mb-1">
                        Brillo 1
                      </label>
                      <input
                        type="color"
                        value={customConfig.luz1}
                        onChange={(e) => actualizarColorCustom('luz1', e.target.value)}
                        className="w-full h-7 rounded border border-border cursor-pointer bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-text-muted mb-1">
                        Brillo 2
                      </label>
                      <input
                        type="color"
                        value={customConfig.luz2}
                        onChange={(e) => actualizarColorCustom('luz2', e.target.value)}
                        className="w-full h-7 rounded border border-border cursor-pointer bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-text-muted mb-1">
                        Brillo 3
                      </label>
                      <input
                        type="color"
                        value={customConfig.luz3}
                        onChange={(e) => actualizarColorCustom('luz3', e.target.value)}
                        className="w-full h-7 rounded border border-border cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Botón Restablecer */}
                  <button
                    type="button"
                    onClick={restablecerTema}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg border border-border hover:bg-surface text-xs font-medium text-text flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
                    Restablecer tema
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

