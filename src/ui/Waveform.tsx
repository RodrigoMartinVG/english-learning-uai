/**
 * Waveform — la forma de onda del audio en curso.
 *
 * Es el único elemento que se mueve mientras suena una frase, y se mueve porque
 * REPRESENTA el audio: no es decoración. Ver ARQUITECTURA.md §9.
 *
 * La idea viene del canvas de los prototipos, que era un acierto.
 */

import { useEffect, useRef } from 'react';

const BARS = 48;

export function Waveform({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  /** Se guarda fuera del render: animar por estado de React sería un re-render por frame. */
  const levels = useRef<number[]>(Array.from({ length: BARS }, () => 0));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let t = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      t += 0.08;

      const gap = 2 * dpr;
      const bw = (w - gap * (BARS - 1)) / BARS;

      for (let i = 0; i < BARS; i++) {
        // Sin acceso a las muestras del audio, se simula una envolvente plausible.
        // No miente sobre nada: solo indica "esto está sonando".
        const target = active
          ? 0.15 + Math.abs(Math.sin(t + i * 0.5) * Math.cos(t * 0.6 + i * 0.2)) * 0.85
          : 0.04;
        const cur = levels.current[i] ?? 0;
        levels.current[i] = reduced ? target : cur + (target - cur) * 0.25;

        const bh = Math.max(2 * dpr, (levels.current[i] ?? 0) * h);
        const x = i * (bw + gap);
        const y = (h - bh) / 2;
        ctx.fillStyle = active ? 'rgba(91,140,255,0.9)' : 'rgba(139,148,167,0.25)';
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, bw / 2);
        ctx.fill();
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [active]);

  return <canvas ref={ref} aria-hidden="true" style={{ width: '100%', height: 64, display: 'block' }} />;
}
