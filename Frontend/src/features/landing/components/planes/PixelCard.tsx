'use client';

import React, { useRef, useEffect } from 'react';

export interface PixelCardProps {
  colors?: string[];
  glowColor?: string;
  accentColor?: string;
  textColor?: string;
  gap?: number;
  pixelSize?: number;
  speed?: number;
  shape?: 'square' | 'circle' | 'diamond';
  origin?: 'pointer' | 'center';
  revealDuration?: number;
  spotlight?: number;
  glow?: number;
  opacity?: number;
  fade?: number;
  clickPulse?: boolean;
  isPicked?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

interface Pixel {
  x: number;
  y: number;
  c: number;
  s: number;
  ph: number;
  r: number;
  j: number;
  p: number;
  d: number;
  m: number;
}

interface Pulse {
  x: number;
  y: number;
  r: number;
  w: number;
}

export function PixelCard({
  colors = ['#f8fafc', '#f1f5f9', '#cbd5e1'],
  glowColor = '#cbd5e1',
  accentColor = '#e9b949',
  textColor = '#e9b949',
  gap = 6,
  pixelSize = 2.4,
  speed = 35,
  shape = 'square',
  origin = 'pointer',
  revealDuration = 700,
  spotlight = 0.6,
  glow = 0.6,
  opacity = 0.5,
  fade = 0.6,
  clickPulse = true,
  isPicked = false,
  className = '',
  children,
  onClick,
}: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const RM = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const cl = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

    const parseHex = (hex: string) => {
      const clean = hex.replace('#', '');
      return [
        parseInt(clean.substring(0, 2), 16) || 200,
        parseInt(clean.substring(2, 4), 16) || 200,
        parseInt(clean.substring(4, 6), 16) || 200,
      ];
    };

    const [gr, gg, gb] = parseHex(glowColor);
    const back = (t: number) => {
      const u = t - 1;
      return 1 + 2.9 * u * u * u + 1.9 * u * u;
    };
    const sm5 = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

    let W = 0;
    let H = 0;
    let R = 1;
    let px: Pixel[] = [];
    let act = false;
    let t = 0;
    let chg = 0;
    let ox = 0;
    let oy = 0;
    let far = 1;
    let sx = 0;
    let sy = 0;
    let vx = 0;
    let vy = 0;
    let tx = 0;
    let ty = 0;
    let sp = 0;
    let hov = false;
    let pulses: Pulse[] = [];
    let last = 0;
    let raf = 0;
    let rel = -1;
    const dt = 1 / 60;
    let hold = isPicked;

    const sched = () => {
      const span = revealDuration / 1000;
      far = 1;
      px.forEach((p) => {
        far = Math.max(far, Math.hypot(p.x - ox, p.y - oy));
      });
      px.forEach((p) => {
        const d = Math.hypot(p.x - ox, p.y - oy) / far;
        p.d = act
          ? d * span * 0.82 + p.j * span * 0.18
          : (1 - d) * span * 0.45 + p.j * span * 0.1;
      });
    };

    const build = () => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (!w || !h || (w === W && h === H)) return;
      W = w;
      H = h;
      R = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * R;
      cv.height = H * R;
      px = [];
      const g = gap;
      const c = Math.floor((W - 1) / g) + 1;
      const rw = Math.floor((H - 1) / g) + 1;
      const ax = (W - (c - 1) * g) / 2;
      const ay = (H - (rw - 1) * g) / 2;
      const nr = Math.min(W, H) * 0.05;
      const fr = Math.min(W, H) * 0.42;

      for (let i = 0; i < c; i++) {
        for (let j = 0; j < rw; j++) {
          const x = ax + i * g;
          const y = ay + j * g;
          const e = Math.min(x, W - x, y, H - y);
          px.push({
            x,
            y,
            c: Math.floor(Math.random() * colors.length),
            s: pixelSize * (0.25 + Math.random() * 0.75),
            ph: Math.random() * 6.283,
            r: 0.55 + Math.random() * 0.9,
            j: Math.random(),
            p: 0,
            d: 0,
            m: 1 - fade * sm5(cl((e - nr) / (fr - nr), 0, 1)),
          });
        }
      }
      if (!ox) ox = W / 2;
      if (!oy) oy = H / 2;
      sched();
    };

    const set = (v: boolean, x?: number, y?: number) => {
      if (act === v) return;
      act = v;
      chg = t;
      if (v) {
        const u = origin === 'pointer' && x !== undefined && y !== undefined;
        ox = u ? x : W / 2;
        oy = u ? y : H / 2;
      }
      sched();
      if (v) el.setAttribute('data-active', '');
      else el.removeAttribute('data-active');
      wake();
    };

    const draw = () => {
      ctx.setTransform(R, 0, 0, R, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const el_ = t - chg;
      const ap = dt / 0.26;
      const ex = dt / 0.22;
      let sum = 0;

      px.forEach((p) => {
        const rd = el_ >= p.d || RM;
        const tg = act ? (rd ? 1 : 0) : rd ? 0 : p.p;
        p.p = RM ? tg : tg > p.p ? Math.min(1, p.p + ap) : tg < p.p ? Math.max(0, p.p - ex) : p.p;
        sum += p.p;
      });

      const avg = px.length ? sum / px.length : 0;
      if (glow > 0 && avg > 0.001) {
        const cx = sp > 0.01 ? sx : ox;
        const cy = sp > 0.01 ? sy : oy;
        const st = glow * opacity * 0.32 * Math.min(1, avg * 1.4);
        const gd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.85);
        gd.addColorStop(0, `rgba(${gr},${gg},${gb},${st})`);
        gd.addColorStop(0.45, `rgba(${gr},${gg},${gb},${st * 0.35})`);
        gd.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
        ctx.fillStyle = gd;
        ctx.fillRect(0, 0, W, H);
      }

      const sr = Math.min(W, H) * 0.38 + 30;
      const ss = spotlight * sp;
      const fq = (speed / 35) * 1.35;

      for (let c = 0; c < colors.length; c++) {
        ctx.fillStyle = colors[c];
        for (const p of px) {
          if (p.c !== c || p.p <= 0.002) continue;
          let s = p.s;
          let a = 0.5 + p.p * 0.38;
          if (!RM && speed > 0) {
            const w = Math.sin(p.ph + t * fq * p.r);
            s *= 0.62 + 0.38 * w;
            a += 0.12 * w + (p.j > 0.92 ? 0.35 * Math.max(0, w) : 0);
          }
          s *= back(p.p);
          const fl = p.p < 1 && act ? Math.sin(p.p * Math.PI) : 0;
          s *= 1 + fl * 0.9;
          a += fl * 0.6;
          if (ss > 0.001) {
            const n = cl(1 - Math.hypot(p.x - sx, p.y - sy) / sr, 0, 1);
            s *= 1 + ss * n * n * 2.4;
            a += ss * n * 0.45;
          }
          a = Math.min(1, a) * p.m * opacity;
          if (a <= 0.004) continue;
          for (const q of pulses) {
            const b = (Math.hypot(p.x - q.x, p.y - q.y) - q.r) / 26;
            const w = Math.exp(-b * b) * q.w;
            s *= 1 + w * 1.4;
            a = Math.min(1, a + w * 0.5);
          }
          ctx.globalAlpha = a;
          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, s * 0.5, 0, 6.283);
            ctx.fill();
          } else if (shape === 'diamond') {
            const h = s * 0.62;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - h);
            ctx.lineTo(p.x + h, p.y);
            ctx.lineTo(p.x, p.y + h);
            ctx.lineTo(p.x - h, p.y);
            ctx.fill();
          } else {
            ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
          }
        }
      }
      ctx.globalAlpha = 1;
      return sum;
    };

    const frame = (now: number) => {
      raf = 0;
      const deltaTime = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      t += deltaTime;
      build();
      if (rel >= 0 && t >= rel && !hov && !hold) {
        rel = -1;
        set(false);
      }
      const w = hov && !RM ? 1 : 0;
      sp += (w - sp) * (1 - Math.exp(-(w ? 6 : 3) * deltaTime));
      const k = 120;
      const dm = 2 * Math.sqrt(k) * 0.9;
      vx += (k * (tx - sx) - dm * vx) * deltaTime;
      vy += (k * (ty - sy) - dm * vy) * deltaTime;
      sx += vx * deltaTime;
      sy += vy * deltaTime;
      const ps = far / Math.max(0.35, (revealDuration / 1000) * 0.9);
      pulses = pulses.filter((q) => {
        q.r += ps * deltaTime;
        q.w = Math.max(0, 1 - q.r / (far + 40));
        return q.w > 0;
      });
      const sum = draw();
      if (act || sum > 0 || pulses.length || sp > 0.002 || Math.abs(vx) + Math.abs(vy) > 0.5) {
        raf = requestAnimationFrame(frame);
      } else {
        last = 0;
      }
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const loc = (e: PointerEvent): [number, number] => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };

    const onPointerEnter = (e: PointerEvent) => {
      const [x, y] = loc(e);
      hov = e.pointerType !== 'touch';
      tx = x;
      ty = y;
      if (sp < 0.01) {
        sx = x;
        sy = y;
        vx = vy = 0;
      }
      rel = -1;
      set(true, x, y);
      wake();
    };

    const onPointerMove = (e: PointerEvent) => {
      const [x, y] = loc(e);
      tx = x;
      ty = y;
      wake();
    };

    const onPointerLeave = (e: PointerEvent) => {
      hov = false;
      if (!hold) {
        if (e.pointerType === 'touch') rel = t + 1.2;
        else set(false);
      }
      wake();
    };

    const onPointerDown = (e: PointerEvent) => {
      const [x, y] = loc(e);
      if (!act) set(true, x, y);
      if (clickPulse && !RM) pulses.push({ x, y, r: 0, w: 1 });
      wake();
    };

    el.addEventListener('pointerenter', onPointerEnter);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('pointerdown', onPointerDown);

    const observer = new ResizeObserver(() => {
      build();
      wake();
    });
    observer.observe(el);

    build();
    tx = sx = W / 2;
    ty = sy = H / 2;

    if (isPicked) {
      hold = true;
      set(true);
    }

    return () => {
      el.removeEventListener('pointerenter', onPointerEnter);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('pointerdown', onPointerDown);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [colors, glowColor, gap, pixelSize, speed, shape, origin, revealDuration, spotlight, glow, opacity, fade, clickPulse, isPicked]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={
        {
          '--pc': accentColor,
          '--pc-t': textColor,
        } as React.CSSProperties
      }
      className={`relative flex flex-col items-center justify-center gap-[0.7vw] w-[clamp(280px,25vw,420px)] h-[min(68vh,38vw)] min-h-[460px] overflow-hidden rounded-[24px] p-[1.6vw] text-center isolate outline-none select-none transition-all duration-300 ${
        isPicked ? 'card-picked' : 'card-rise'
      } ${className}`}
    >
      {/* Canvas interactivo de partículas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Borde interior sutil */}
      <div className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]" />

      {/* Contenido interactivo */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full gap-[0.6vw]">
        {children}
      </div>
    </div>
  );
}
