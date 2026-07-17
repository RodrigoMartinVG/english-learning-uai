/**
 * AltVoicesButton — escuchar la última frase en otras voces.
 *
 * Variabilidad fonética a pedido (§ PRD): el alumno oye la MISMA frase en
 * timbres y acentos distintos, para entrenar el oído a no depender de una voz.
 *
 * Como el botón de marcar, opera sobre lo ÚLTIMO que sonó: así una sola
 * instancia en el header sirve en cualquier mecánica. Solo se activa si ese
 * audio tiene versiones alternativas pregeneradas (las tienen las frases, no el
 * deletreo ni las narraciones largas).
 */

import { useEffect, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../audio/AudioProvider.tsx';
import { manifest } from '../data/content.ts';
import './altvoices.css';

/** Voces alternativas y su etiqueta. Debe coincidir con ALT_VOICES de build-audio. */
const ALT = [
  { id: 'af_bella', label: 'US ♀' },
  { id: 'am_michael', label: 'US ♂' },
  { id: 'bm_george', label: 'GB ♂' },
] as const;

export function AltVoicesButton() {
  const audio = useAudio();
  useAudioState(); // re-render cuando cambia lo que sonó
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const last = audio.getLastPlayed();
  // Las claves alternativas cuelgan de la base: "en1.u1.p.007.v.af_bella".
  const base = last?.key ?? '';
  const available = last?.source === 'file' ? ALT.filter((v) => `${base}.v.${v.id}` in manifest.entries) : [];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Si cambió el audio y ya no hay alternativas, cerrar el panel.
  useEffect(() => {
    if (!available.length) setOpen(false);
  }, [base, available.length]);

  const playAlt = (voiceId: string) => {
    if (!last) return;
    void audio.speak({ key: `${base}.v.${voiceId}`, text: last.text, speakerId: last.speakerId });
  };

  return (
    <div className="altv" ref={ref}>
      <button
        className="altv__btn"
        onClick={() => setOpen((o) => !o)}
        disabled={!available.length}
        title={
          available.length
            ? 'Escuchar la última frase en otras voces'
            : 'Reproducí una frase para oírla en otras voces'
        }
        aria-label="Escuchar en otras voces"
        aria-expanded={open}
      >
        🎙
      </button>
      {open && available.length > 0 && (
        <div className="altv__pop" role="menu">
          <p className="altv__title">La misma frase, otra voz</p>
          {available.map((v) => (
            <button key={v.id} className="altv__opt" onClick={() => playAlt(v.id)} role="menuitem">
              <span aria-hidden="true">🔊</span> {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
