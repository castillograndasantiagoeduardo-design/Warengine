'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, TabType } from '@/components/ui/Navbar';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { AuthCard } from '@/features/autenticacion/components/AuthCard';

export default function AccesoPage() {
  const router = useRouter();

  const handleNavigate = (tab: TabType) => {
    // Al navegar a cualquiera de las pestañas principales, redirige a la landing
    router.push(`/?tab=${tab}`);
  };

  return (
    <main
      style={
        {
          '--ac': '#e9b949',
          '--ac-dk': '#b88a1f',
          '--ac-t': '#e9b949',
          '--ac-fg': '#14213D',
        } as React.CSSProperties
      }
      className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-x-hidden bg-[radial-gradient(75vw_75vh_at_50%_50%,#162544_0%,#101a30_60%,#090f1d_100%)] select-none px-4"
    >
      {/* Grano analógico de fondo */}
      <NoiseOverlay />

      {/* Navbar Superior Fijo Estándar WarEngine */}
      <Navbar activeTab="inicio" onNavigate={handleNavigate} />

      {/* Tarjeta de Autenticación Neumórfica Centrada exactamente en X e Y */}
      <section
        className="w-full flex items-center justify-center z-10 my-auto py-12"
        aria-label="Panel de autenticación WarEngine"
      >
        <AuthCard />
      </section>

      {/* Pie de página sutil con marca WarEngine anclado abajo sin desplazar el centro */}
      <footer className="absolute bottom-2.5 left-0 right-0 text-center text-[clamp(10px,0.9vw,12px)] text-white/30 font-[family-name:var(--font-archivo)] z-10 pointer-events-none">
        WarEngine &copy; {new Date().getFullYear()} &mdash; Sistema Integral de Gestión Comercial & Logística
      </footer>
    </main>
  );
}
