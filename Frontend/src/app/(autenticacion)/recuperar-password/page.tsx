'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar, TabType } from '@/components/ui/Navbar';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { GlassyOtpCard } from '@/features/autenticacion/components/GlassyOtpCard';

function RecuperarPasswordContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const handleNavigate = (tab: TabType) => {
    router.push(`/?tab=${tab}`);
  };

  return (
    <main
      className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-[#070d1d] select-none px-4 py-12"
      style={{
        background:
          'radial-gradient(circle at 50% 20%, #0d2248 0%, #081124 50%, #050814 100%)',
      }}
    >
      {/* Ondas azules/negras decorativas de fondo (Glassy Wave Effect) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <svg
          className="absolute -top-[20%] -left-[10%] w-[130%] h-[140%] text-cyan-600/15"
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,300 C200,400 350,200 500,320 C650,440 800,280 1000,360 L1000,1000 L0,1000 Z"
            fill="currentColor"
          />
          <path
            d="M0,500 C250,580 400,420 600,510 C800,600 850,480 1000,530 L1000,1000 L0,1000 Z"
            fill="#0369a1"
            fillOpacity="0.1"
          />
        </svg>
      </div>

      {/* Grano analógico de fondo característico de WareEngine */}
      <NoiseOverlay />

      {/* Navbar Superior Fijo */}
      <Navbar activeTab="inicio" onNavigate={handleNavigate} />

      {/* Tarjeta Glassy OTP V4 centrada */}
      <section
        className="w-full flex items-center justify-center z-10 my-auto"
        aria-label="Recuperación de contraseña Glassy OTP"
      >
        <GlassyOtpCard emailInicial={emailParam} />
      </section>

      {/* Pie de página sutil con marca WarEngine */}
      <footer className="absolute bottom-2.5 left-0 right-0 text-center text-[clamp(10px,0.9vw,12px)] text-white/30 font-[family-name:var(--font-archivo)] z-10 pointer-events-none">
        WarEngine &copy; {new Date().getFullYear()} &mdash; Sistema de Seguridad y Autenticación Criptográfica
      </footer>
    </main>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070d1d]" />}>
      <RecuperarPasswordContenido />
    </Suspense>
  );
}
