'use client';

import React from 'react';
import { Button3D } from './Button3D';

export type TabType = 'inicio' | 'alcance' | 'planes' | 'nosotros';

interface NavbarProps {
  activeTab: TabType;
  onNavigate: (tab: TabType) => void;
  accentColor?: string;
}

export function Navbar({ activeTab, onNavigate }: NavbarProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-[max(3vw,env(safe-area-inset-left))] pt-[max(1.1vw,env(safe-area-inset-top))] transition-all duration-300">
      {/* Logotipo WarEngine */}
      <a
        href="#inicio"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('inicio');
        }}
        className="w-[clamp(38px,4.8vw,104px)] block select-none"
        aria-label="WarEngine Inicio"
      >
        <svg
          viewBox="60 50 1015 575"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          role="img"
          aria-label="Logo WarEngine"
        >
          <polygon
            fill="#D9A02D"
            points="75,85 445,215 490,305 428,452 600,213 665,300 487,610 385,425 235,318 180,240 360,305 130,165"
          />
          <polygon
            fill="#ffffff"
            points="1060,65 740,590 635,432 700,335 745,415 830,218 775,205"
          />
        </svg>
      </a>

      {/* Navegación */}
      <nav aria-label="Navegación principal">
        <ul className="flex items-center gap-[clamp(14px,3.8vw,48px)] ml-[2vw] list-none">
          <li>
            <button
              onClick={() => onNavigate('inicio')}
              className={`font-[family-name:var(--font-pixelify)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'inicio'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              INICIO
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('alcance')}
              className={`font-[family-name:var(--font-pixelify)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'alcance'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              ALCANCE
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('planes')}
              className={`font-[family-name:var(--font-pixelify)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'planes'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              PLANES
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('nosotros')}
              className={`font-[family-name:var(--font-pixelify)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'nosotros'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              NOSOTROS
            </button>
          </li>
        </ul>
      </nav>

      {/* Botón Acción: Acceso / Login */}
      <Button3D
        href="/acceso"
        className="ml-auto"
      >
        INICIAR
      </Button3D>
    </header>
  );
}
