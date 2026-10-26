'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, type TabType } from '@/components/ui/Navbar';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import {
  HeroRobotCanvas,
  HeroCopy,
  AlcanceSection,
  PlanesSection,
  NosotrosModal,
  SLIDES,
  type SlideData,
  type ThemeColors,
} from '@/features/landing';

const INITIAL_THEME: ThemeColors = {
  c: '#e3b341',
  k: '#b88a1f',
  tc: '#e3b341',
  fg: '#111111',
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(-1);
  const [theme, setTheme] = useState<ThemeColors>(INITIAL_THEME);

  const handleNavigate = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'inicio' || tab === 'planes') {
      setTheme((prev) =>
        prev.c === INITIAL_THEME.c &&
        prev.k === INITIAL_THEME.k &&
        prev.tc === INITIAL_THEME.tc &&
        prev.fg === INITIAL_THEME.fg
          ? prev
          : INITIAL_THEME
      );
    } else if (tab === 'alcance') {
      const first = SLIDES[0];
      setTheme((prev) => {
        if (
          prev.c === first.c &&
          prev.k === first.k &&
          prev.tc === first.tc &&
          prev.fg === first.fg
        ) {
          return prev;
        }
        return {
          c: first.c,
          k: first.k,
          tc: first.tc,
          fg: first.fg,
        };
      });
    }
  }, []);

  const handleSlideThemeChange = useCallback((slide: SlideData) => {
    setTheme((prev) => {
      if (
        prev.c === slide.c &&
        prev.k === slide.k &&
        prev.tc === slide.tc &&
        prev.fg === slide.fg
      ) {
        return prev;
      }
      return {
        c: slide.c,
        k: slide.k,
        tc: slide.tc,
        fg: slide.fg,
      };
    });
  }, []);

  const handleSelectPlanFromAlcance = (slideIndex: number) => {
    setSelectedPlanIndex(slideIndex);
    setActiveTab('planes');
  };

  // Atajo de teclado 'Escape' para volver al inicio
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

      {/* Vista NOSOTROS (Modal informativo) */}
      <NosotrosModal
        isOpen={activeTab === 'nosotros'}
        onClose={() => handleNavigate('inicio')}
      />
    </main>
  );
}
