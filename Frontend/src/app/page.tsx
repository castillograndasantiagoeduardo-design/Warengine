'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from '@/components/ui/Navbar';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { HeroRobotCanvas } from '@/components/hero/HeroRobotCanvas';
import { HeroCopy } from '@/components/hero/HeroCopy';
import { AlcanceSection, SlideData, SLIDES } from '@/components/alcance/AlcanceSection';
import { PlanesSection } from '@/components/planes/PlanesSection';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(-1);
  const [theme, setTheme] = useState({
    c: '#e3b341',
    k: '#b88a1f',
    tc: '#e3b341',
    fg: '#111111',
  });

  const handleNavigate = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'inicio') {
      setTheme({
        c: '#e3b341',
        k: '#b88a1f',
        tc: '#e3b341',
        fg: '#111111',
      });
    } else if (tab === 'alcance') {
      const first = SLIDES[0];
      setTheme({
        c: first.c,
        k: first.k,
        tc: first.tc,
        fg: first.fg,
      });
    } else if (tab === 'planes') {
      setTheme({
        c: '#e3b341',
        k: '#b88a1f',
        tc: '#e3b341',
        fg: '#111111',
      });
    }
  };

  const handleSlideThemeChange = (slide: SlideData) => {
    if (activeTab === 'alcance') {
      setTheme({
        c: slide.c,
        k: slide.k,
        tc: slide.tc,
        fg: slide.fg,
      });
    }
  };

  const handleSelectPlanFromAlcance = (slideIndex: number) => {
    setSelectedPlanIndex(slideIndex);
    setActiveTab('planes');
  };

  // Keyboard escape shortcut to return home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeTab !== 'inicio') {
        handleNavigate('inicio');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <main
      style={
        {
          '--ac': theme.c,
          '--ac-dk': theme.k,
          '--ac-t': theme.tc,
          '--ac-fg': theme.fg,
        } as React.CSSProperties
      }
      className="relative w-screen h-screen h-[100dvh] overflow-hidden bg-[radial-gradient(60vw_60vh_at_0%_100%,rgba(227,179,65,0.55),transparent_70%),radial-gradient(70vw_70vh_at_10%_0%,#14224a,transparent_70%),linear-gradient(100deg,#0f1b3d_0%,#0a0f1f_45%,#1b1b1d_100%)] select-none"
    >
      {/* Grano analógico overlay */}
      <NoiseOverlay />

      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />

      {/* Vista HERO */}
      <HeroRobotCanvas isVisible={activeTab === 'inicio'} />
      <HeroCopy isVisible={activeTab === 'inicio'} />

      {/* Vista ALCANCE */}
      <AlcanceSection
        isVisible={activeTab === 'alcance'}
        onSelectPlan={handleSelectPlanFromAlcance}
        onThemeChange={handleSlideThemeChange}
      />

      {/* Vista PLANES */}
      <PlanesSection
        isVisible={activeTab === 'planes'}
        selectedPlanIndex={selectedPlanIndex}
      />

      {/* Vista NOSOTROS (Modal informativo rápido) */}
      {activeTab === 'nosotros' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-[#17151c] border border-white/10 rounded-2xl p-8 max-w-lg text-center shadow-2xl">
            <h2 className="font-[family-name:var(--font-anton)] text-3xl text-[var(--gold)] mb-4 uppercase">
              Sobre WarEngine
            </h2>
            <p className="font-[family-name:var(--font-archivo)] font-light text-white/90 leading-relaxed mb-6">
              WarEngine es la plataforma empresarial integral de última generación diseñada para potenciar la gestión multi-sucursal, facturación POS en tiempo real y trazabilidad logística sin límites.
            </p>
            <button
              onClick={() => handleNavigate('inicio')}
              className="btn-3d px-6 py-2 text-sm"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
