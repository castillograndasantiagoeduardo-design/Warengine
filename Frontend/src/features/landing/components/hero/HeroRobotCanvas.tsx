'use client';

/**
 * HeroRobotCanvas.tsx — Canvas interactivo del robot de WarEngine siguiendo el cursor.
 *
 * NOTA: La lógica interna de animación se preserva idéntica. Su optimización de rendimiento
 * se abordará en una rama posterior según lo indicado.
 */

import React, { useEffect, useRef } from 'react';

const FRAMES = 116;
const FPS = 24;
const T_LEFT = 2.1;
const T_CENTER = 3.4;
const T_RIGHT = 4.75;
const SMOOTH = 0.09;
const FOCUS_X = 0.8;

export function HeroRobotCanvas({ isVisible = true }: { isVisible?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    const imgs: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    let nextI = 0;
    let needsDraw = true;

    const path = (i: number) =>
      `/images/robot/f_${String(i + 1).padStart(3, '0')}.webp`;

    const ready = (i: number) => {
      const im = imgs[i];
      return im && im.complete && im.naturalWidth ? im : null;
    };

    const nearest = (i: number) => {
      for (let d = 0; d < FRAMES; d++) {
        const r = ready(i - d) || ready(i + d);
        if (r) return r;
      }
      return null;
    };

    const drawImg = (img: HTMLImageElement, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      const isPortrait = window.innerWidth <= 1024;
      let fx = FOCUS_X;
      if (isPortrait && dw > cw) {
        fx = Math.min(1, Math.max(0, (0.72 * dw - cw / 2) / (dw - cw)));
      }
      ctx.drawImage(img, -(dw - cw) * fx, 0, dw, dh);
      ctx.globalAlpha = 1;
    };

    let lastPos = T_CENTER * FPS;

    const render = (pos: number) => {
      lastPos = pos;
      const a = Math.max(0, Math.min(FRAMES - 1, Math.floor(pos)));
      const b = Math.min(FRAMES - 1, a + 1);
      const f = pos - a;
      const base = nearest(a);
      if (!base) return false;
      drawImg(base, 1);
      const nxt = ready(b);
      if (f > 0.01 && nxt) drawImg(nxt, f);
      return true;
    };

    const resize = () => {
      const isPortrait = window.innerWidth <= 1024;
      const dpr = Math.min(window.devicePixelRatio || 1, isPortrait ? 1.5 : 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      render(lastPos);
      needsDraw = true;
    };

    // Sequential lazy image loading
    const loadNext = () => {
      if (nextI >= FRAMES) return;
      const i = nextI++;
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        needsDraw = true;
        loadNext();
      };
      im.onerror = () => {
        loadNext();
      };
      im.src = path(i);
      imgs[i] = im;
    };

    const isPortrait = window.innerWidth <= 1024;
    const initialBatch = isPortrait ? 8 : FRAMES;
    for (let k = 0; k < initialBatch; k++) loadNext();

    const F_L = T_LEFT * FPS;
    const F_C = T_CENTER * FPS;
    const F_R = T_RIGHT * FPS;
    let target = F_C;
    let current = F_C;
    const hasMouse = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    const setTargetFromX = (x: number) => {
      const n = Math.max(0, Math.min(1, x / window.innerWidth));
      target =
        n < 0.5
          ? F_L + (F_C - F_L) * (n * 2)
          : F_C + (F_R - F_C) * ((n - 0.5) * 2);
    };

    const handlePointerMove = (e: PointerEvent) => {
      setTargetFromX(e.clientX);
    };

    const handleMouseLeave = () => {
      target = F_C;
    };

    if (hasMouse) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    const autoplay = !hasMouse && !prefersReducedMotion;
    let autoPos = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (autoplay) {
        let avail = 0;
        while (avail < FRAMES && ready(avail)) avail++;
        if (avail > 1) {
          autoPos = (autoPos + dt * FPS) % avail;
          current = autoPos;
          needsDraw = true;
        }
      } else {
        const k = 1 - Math.pow(1 - SMOOTH, dt * 60);
        const d = target - current;
        if (Math.abs(d) > 0.005) {
          current += d * k;
          needsDraw = true;
        }
      }

      if (needsDraw) {
        needsDraw = !render(current);
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    window.addEventListener('resize', resize);
    resize();
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      if (hasMouse) {
        window.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full block transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[4vw] pointer-events-none'
      }`}
      aria-label="Robot animado WarEngine sosteniendo una caja"
    />
  );
}
