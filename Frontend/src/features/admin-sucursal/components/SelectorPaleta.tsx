'use client';

/**
 * SelectorPaleta.tsx — Panel de Apariencia del Dashboard de WarEngine.
 *
 * Implementación oficial copiada y adaptada directamente de prueba-diseno-warengine (localhost:3005):
 * 1. MODO: Oscuro / Claro
 * 2. TEMAS: 11 paletas oficiales en cuadrícula de 3 columnas con muestras de 3 colores y selección activa
 * 3. EFECTO DE FONDO: Orbes difusos / Aurora ambiental / Retícula + luz (con 'malla' por defecto)
 * 4. PERSONALIZAR COLORES (AVANZADO): Acordeón con 5 roles de color, catálogo de muestras y selector libre
 * 5. POP-OVER FLOTANTE: Anclado absolutamente a la barra superior, no desplaza ni deforma el layout.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  X,
  Sun,
  Moon,
  Sparkles,
  Check,
  ChevronDown,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  type ConfiguracionPaletaPersonalizada,
  CATALOGO_COLORES_ACENTO,
  CATALOGO_COLORES_FONDO,
  CONFIG_BASE_POR_PALETA,
  generarVariablesDesdeConfig,
  aplicarVariablesPersonalizadasEnDom,
  limpiarVariablesPersonalizadasEnDom,
} from '@/lib/generadorPaleta';

export type IdPaleta =
  | 'zafiro'
  | 'violeta'
  | 'cian'
  | 'esmeralda'
  | 'cobre'
  | 'acero'
  | 'grafito'
  | 'indigo'
  | 'petroleo'
  | 'vino'
  | 'oro'
  | 'personalizada';

export type IdFondo = 'orbes' | 'aurora' | 'malla';

type RolColorPersonalizado =
  | 'acento'
  | 'fondoOscuro'
  | 'luz1'
  | 'luz2'
  | 'luz3';

interface OpcionPaleta {
  id: Exclude<IdPaleta, 'personalizada'>;
  nombre: string;
}

interface OpcionFondo {
  id: IdFondo;
  nombre: string;
}

const PALETAS: OpcionPaleta[] = [
  { id: 'acero', nombre: 'Acero Corporativo' },
  { id: 'grafito', nombre: 'Grafito y Titanio' },
  { id: 'indigo', nombre: 'Índigo Institucional' },
  { id: 'petroleo', nombre: 'Azul Petróleo' },
  { id: 'vino', nombre: 'Borgoña Directivo' },
  { id: 'oro', nombre: 'Oro y Obsidiana' },
  { id: 'zafiro', nombre: 'Zafiro' },
  { id: 'violeta', nombre: 'Violeta' },
  { id: 'cian', nombre: 'Cian' },
  { id: 'esmeralda', nombre: 'Esmeralda' },
  { id: 'cobre', nombre: 'Cobre' },
];

const VARIANTES_FONDO: OpcionFondo[] = [
  { id: 'orbes', nombre: 'Orbes difusos' },
  { id: 'aurora', nombre: 'Aurora ambiental' },
  { id: 'malla', nombre: 'Retícula + luz' },
];

const ROLES_COLOR: Array<{
  id: RolColorPersonalizado;
  etiqueta: string;
}> = [
  { id: 'acento', etiqueta: 'Color de acento' },
  { id: 'fondoOscuro', etiqueta: 'Fondo' },
  { id: 'luz1', etiqueta: 'Brillo principal' },
  { id: 'luz2', etiqueta: 'Brillo secundario' },
  { id: 'luz3', etiqueta: 'Brillo terciario' },
];

export function SelectorPaleta() {
  const [abierto, setAbierto] = useState<boolean>(false);
  const [avanzadoAbierto, setAvanzadoAbierto] = useState<boolean>(false);
  const [paletaActiva, setPaletaActiva] = useState<IdPaleta>('zafiro');
  const [ultimaRecomendada, setUltimaRecomendada] =
    useState<Exclude<IdPaleta, 'personalizada'>>('zafiro');
  const [fondoActivo, setFondoActivo] = useState<IdFondo>('malla');
  const [esOscuro, setEsOscuro] = useState<boolean>(true);

  const [rolActivo, setRolActivo] = useState<RolColorPersonalizado>('acento');
  const [configCustom, setConfigCustom] =
    useState<ConfiguracionPaletaPersonalizada>(CONFIG_BASE_POR_PALETA.zafiro);

  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sincronizarDesdeDom = () => {
      const html = document.documentElement;
      const p = (html.getAttribute('data-paleta') as IdPaleta) || 'zafiro';
      const f = (html.getAttribute('data-fondo') as IdFondo) || 'malla';
      const oscuro = html.classList.contains('dark');
      setPaletaActiva(p);
      if (p !== 'personalizada' && CONFIG_BASE_POR_PALETA[p]) {
        setUltimaRecomendada(p);
      }
      setFondoActivo(f);
      setEsOscuro(oscuro);

      try {
        const guardado = localStorage.getItem('warengine-paleta-custom');
        if (guardado) {
          const parsed = JSON.parse(guardado) as ConfiguracionPaletaPersonalizada;
          setConfigCustom(parsed);
          if (p === 'personalizada') {
            aplicarVariablesPersonalizadasEnDom(parsed);
          }
        } else if (p !== 'personalizada' && CONFIG_BASE_POR_PALETA[p]) {
          setConfigCustom(CONFIG_BASE_POR_PALETA[p]);
        }
      } catch {}
    };

    sincronizarDesdeDom();

    const observer = new MutationObserver(sincronizarDesdeDom);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-paleta', 'data-fondo'],
    });

    return () => observer.disconnect();
  }, []);

  // Cierra el popover al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!abierto) return;

    const alHacerClicFuera = (e: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }
    };

    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', alHacerClicFuera);
    document.addEventListener('keydown', alPresionarTecla);
    return () => {
      document.removeEventListener('mousedown', alHacerClicFuera);
      document.removeEventListener('keydown', alPresionarTecla);
    };
  }, [abierto]);

  const seleccionarPaletaRecomendada = (
    id: Exclude<IdPaleta, 'personalizada'>
  ) => {
    limpiarVariablesPersonalizadasEnDom();
    setPaletaActiva(id);
    setUltimaRecomendada(id);
    document.documentElement.setAttribute('data-paleta', id);

    if (CONFIG_BASE_POR_PALETA[id]) {
      setConfigCustom(CONFIG_BASE_POR_PALETA[id]);
    }

    try {
      localStorage.setItem('warengine-paleta', id);
    } catch {}
  };

  const actualizarColorPersonalizado = (
    rol: RolColorPersonalizado,
    nuevoHex: string
  ) => {
    const hexNormalizado = nuevoHex.startsWith('#') ? nuevoHex : `#${nuevoHex}`;
    const nuevaConfig: ConfiguracionPaletaPersonalizada = {
      ...configCustom,
      [rol]: hexNormalizado,
    };

    setConfigCustom(nuevaConfig);

    if (/^#[0-9A-Fa-f]{6}$/.test(hexNormalizado)) {
      setPaletaActiva('personalizada');
      document.documentElement.setAttribute('data-paleta', 'personalizada');
      aplicarVariablesPersonalizadasEnDom(nuevaConfig);

      try {
        const vars = generarVariablesDesdeConfig(nuevaConfig);
        localStorage.setItem('warengine-paleta', 'personalizada');
        localStorage.setItem(
          'warengine-paleta-custom',
          JSON.stringify(nuevaConfig)
        );
        localStorage.setItem(
          'warengine-paleta-custom-vars',
          JSON.stringify(vars)
        );
      } catch {}
    }
  };

  const restablecerATemaRecomendado = () => {
    seleccionarPaletaRecomendada(ultimaRecomendada);
  };

  const seleccionarFondo = (id: IdFondo) => {
    setFondoActivo(id);
    document.documentElement.setAttribute('data-fondo', id);
    try {
      localStorage.setItem('warengine-fondo', id);
    } catch {}
  };

  const cambiarTema = (modoOscuro: boolean) => {
    setEsOscuro(modoOscuro);
    const html = document.documentElement;
    if (modoOscuro) {
      html.classList.add('dark');
      html.classList.remove('light');
      try {
        localStorage.setItem('warengine-tema', 'dark');
      } catch {}
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      try {
        localStorage.setItem('warengine-tema', 'light');
      } catch {}
    }
  };

  const nombrePaletaActiva =
    paletaActiva === 'personalizada'
      ? 'Personalizado'
      : (PALETAS.find((p) => p.id === paletaActiva) || PALETAS[0]).nombre;

  const catalogoMuestrasActual =
    rolActivo === 'fondoOscuro'
      ? CATALOGO_COLORES_FONDO
      : CATALOGO_COLORES_ACENTO;

  const valorHexRolActivo = configCustom[rolActivo] || '#3b6cf2';

  return (
    <div ref={contenedorRef} className="relative font-sans">
      {/* Botón de tema en la Barra Superior */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setAbierto(!abierto)}
        data-muestra={paletaActiva}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer ${
          abierto
            ? 'bg-brand-600/15 border border-brand-500/40 text-text'
            : 'superficie-control text-text'
        }`}
        title={`Tema actual: ${nombrePaletaActiva}`}
        aria-label="Abrir panel de apariencia del dashboard"
        aria-expanded={abierto}
        aria-haspopup="dialog"
      >
        <Palette className="w-4 h-4 text-text-muted shrink-0" />
        <div
          className="hidden md:flex items-center -space-x-1 shrink-0"
          aria-hidden="true"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--m-1)] ring-1 ring-black/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--m-2)] ring-1 ring-black/20" />
        </div>
        <span className="hidden sm:inline font-medium text-text whitespace-nowrap">
          {nombrePaletaActiva}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 hidden sm:block ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Panel Apariencia del dashboard (vista única sin pestañas) */}
      {abierto && (
        <div
          className="absolute right-0 mt-2.5 w-80 sm:w-[410px] max-h-[calc(100vh-88px)] overflow-y-auto vidrio-popover p-4 space-y-3.5 text-xs z-50 shadow-2xl"
          role="dialog"
          aria-label="Apariencia del dashboard"
        >
          {/* Cabecera del panel */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-text-muted" />
              <span className="font-semibold text-sm font-titulos text-text">
                Apariencia del dashboard
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="p-1 rounded-lg text-text-muted hover:text-text superficie-control transition-colors cursor-pointer"
              aria-label="Cerrar panel de apariencia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. MODO CLARO / OSCURO */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Modo
            </p>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900/6 dark:bg-white/6 border border-border">
              <button
                type="button"
                onClick={() => cambiarTema(true)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  esOscuro
                    ? 'bg-brand-600 text-btn-primario-texto font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Oscuro</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarTema(false)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  !esOscuro
                    ? 'bg-brand-600 text-btn-primario-texto font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Claro</span>
              </button>
            </div>
          </div>

          {/* 2. TEMAS OFICIALES */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Temas
              </p>
              {paletaActiva === 'personalizada' && (
                <span className="text-[11px] font-medium text-text">
                  Activo: Personalizado
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PALETAS.map((paleta) => {
                const activa = paletaActiva === paleta.id;
                return (
                  <button
                    key={paleta.id}
                    type="button"
                    data-muestra={paleta.id}
                    onClick={() => seleccionarPaletaRecomendada(paleta.id)}
                    className={`flex flex-col justify-between p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      activa
                        ? 'bg-brand-500/15 border-brand-500 text-text font-semibold shadow-xs'
                        : 'superficie-control text-text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className="flex items-center -space-x-1 shrink-0"
                        aria-hidden="true"
                      >
                        <span className="w-3 h-3 rounded-full bg-[var(--m-1)] ring-1 ring-black/25" />
                        <span className="w-3 h-3 rounded-full bg-[var(--m-2)] ring-1 ring-black/25" />
                        <span className="w-3 h-3 rounded-full bg-[var(--m-3)] ring-1 ring-black/25" />
                      </div>
                      {activa && (
                        <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300 shrink-0" />
                      )}
                    </div>
                    <span className="block text-[11px] text-text leading-tight truncate w-full">
                      {paleta.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. EFECTO DE FONDO (Orbes / Aurora / Retícula + luz) */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Efecto de fondo
            </p>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900/6 dark:bg-white/6 border border-border">
              {VARIANTES_FONDO.map((variante) => {
                const activo = fondoActivo === variante.id;
                return (
                  <button
                    key={variante.id}
                    type="button"
                    onClick={() => seleccionarFondo(variante.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium text-center transition-colors cursor-pointer whitespace-nowrap ${
                      activo
                        ? 'bg-brand-600 text-btn-primario-texto font-semibold shadow-xs'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {variante.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. PERSONALIZAR COLORES (AVANZADO) — Acordeón cerrado por defecto */}
          <div className="pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => setAvanzadoAbierto(!avanzadoAbierto)}
              aria-expanded={avanzadoAbierto}
              className="w-full flex items-center justify-between py-1.5 px-1 text-left cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-text-muted group-hover:text-text transition-colors" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted group-hover:text-text transition-colors">
                  Personalizar colores (avanzado)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {paletaActiva === 'personalizada' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-600 text-btn-primario-texto">
                    Personalizado
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
                    avanzadoAbierto ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {avanzadoAbierto && (
              <div className="mt-2 p-3 rounded-xl border border-border bg-slate-900/4 dark:bg-white/3 space-y-3">
                {/* Selector de rol de color */}
                <div className="flex flex-wrap gap-1">
                  {ROLES_COLOR.map((rol) => {
                    const seleccionado = rolActivo === rol.id;
                    const colorActual = configCustom[rol.id];
                    return (
                      <button
                        key={rol.id}
                        type="button"
                        onClick={() => setRolActivo(rol.id)}
                        className={`flex items-center gap-1.5 py-1 px-2 rounded-lg border text-[11px] transition-all cursor-pointer ${
                          seleccionado
                            ? 'bg-brand-500/15 border-brand-500 text-text font-semibold shadow-xs'
                            : 'superficie-control text-text-muted hover:text-text'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full ring-1 ring-black/20 dark:ring-white/25 shrink-0"
                          style={{ backgroundColor: colorActual }}
                        />
                        <span>{rol.etiqueta}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Cuadrícula de muestras + Selector nativo */}
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-1.5">
                    {catalogoMuestrasActual.map((muestra) => {
                      const coincide =
                        valorHexRolActivo.toLowerCase() ===
                        muestra.hex.toLowerCase();
                      return (
                        <button
                          key={muestra.hex}
                          type="button"
                          onClick={() =>
                            actualizarColorPersonalizado(rolActivo, muestra.hex)
                          }
                          title={muestra.nombre}
                          aria-label={`Elegir color ${muestra.nombre}`}
                          style={{ backgroundColor: muestra.hex }}
                          className={`h-6 rounded-lg flex items-center justify-center transition-transform cursor-pointer ${
                            coincide
                              ? 'ring-2 ring-white dark:ring-white scale-105 shadow-sm z-10'
                              : 'ring-1 ring-black/20 dark:ring-white/15 hover:scale-105'
                          }`}
                        >
                          {coincide && (
                            <Check className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selector libre y botón de restablecer */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg superficie-control cursor-pointer hover:text-text transition-colors"
                      title="Elegir tono personalizado"
                    >
                      <input
                        type="color"
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(valorHexRolActivo)
                            ? valorHexRolActivo
                            : '#3b6cf2'
                        }
                        onChange={(e) =>
                          actualizarColorPersonalizado(rolActivo, e.target.value)
                        }
                        className="w-4 h-4 rounded border-0 p-0 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-[11px] text-text uppercase">
                        {valorHexRolActivo}
                      </span>
                    </label>

                    {paletaActiva === 'personalizada' && (
                      <button
                        type="button"
                        onClick={restablecerATemaRecomendado}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg superficie-control text-[11px] font-medium text-text-muted hover:text-text transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restablecer tema</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
