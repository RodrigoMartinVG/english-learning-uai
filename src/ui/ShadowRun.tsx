/**
 * ShadowRun — copiar un texto largo frase por frase (la copia guiada / sombra).
 *
 * Es el escalón que falta entre oír un modelo entero y producirlo de memoria:
 * suena un fragmento, lo repetís, y recién ahí viene el siguiente. Lo comparten
 * "Armá el guion" (copiar el modelo) y el "Simulacro de final oral", que antes
 * solo dejaba hablar de corrido — y de memoria, que es su parte engorrosa.
 *
 * No puntúa pronunciación (ARQUITECTURA.md §6.4): cuenta cuántos fragmentos tomó
 * el reconocedor y entrega tus grabaciones para el cotejo A/B.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioProvider.tsx';
import { SpeakPanel } from './SpeakPanel.tsx';
import type { Recording } from '../audio/Recorder.ts';
import { MODEL_VOICES } from '../../content/kokoro-voices.ts';
import './shadowrun.css';

/** Un fragmento del texto con su clave de audio pregenerado. */
export interface ShadowChunk {
  text: string;
  audioKey: string;
}

export interface ShadowResult {
  /** Los fragmentos copiados, en orden: concatenados son el texto entero. */
  texts: string[];
  /** Cuántos tomó el reconocedor por buenos. Señal real, no un puntaje inventado. */
  hits: number;
  /**
   * Tu grabación de cada fragmento, en orden. Al entregarlas, ShadowRun deja de
   * ser su dueño: quien las recibe se hace cargo de revocarlas.
   */
  clips: Recording[];
}

export interface ShadowRunProps {
  chunks: ShadowChunk[];
  speakerId: string;
  /** Sombra pura: no se muestra el texto, se copia de oído. */
  audioOnly?: boolean;
  /** Prefijo del contador ("Versión A"), si el consumidor lo necesita. */
  label?: string;
  lang?: string;
  onFinish: (r: ShadowResult) => void;
}

export function ShadowRun({
  chunks,
  speakerId,
  audioOnly = false,
  label,
  lang = 'en-US',
  onFinish,
}: ShadowRunProps) {
  const audio = useAudio();
  const [idx, setIdx] = useState(0);
  const [voice, setVoice] = useState<string | null>(null); // null = la voz del texto
  const [built, setBuilt] = useState<string[]>([]);
  const clips = useRef<Recording[]>([]);
  const hits = useRef(0);
  // Las grabaciones se entregaron en onFinish: no revocarlas al desmontar.
  const handedOff = useRef(false);

  useEffect(
    () => () => {
      if (!handedOff.current) clips.current.forEach((r) => r.revoke());
    },
    []
  );

  const chunk = chunks[idx];
  const neighbourhood = useMemo(() => chunks.map((c) => c.text), [chunks]);

  // Voces con clip por-frase para TODAS las oraciones: solo esas se ofrecen (si no,
  // esa frase caería a la voz del navegador).
  const voiceOptions = useMemo(
    () =>
      MODEL_VOICES.filter(
        (v) => chunks.length > 0 && chunks.every((c) => audio.hasFile(`${c.audioKey}.v.${v.id}`))
      ),
    [chunks, audio]
  );

  const play = useCallback(() => {
    if (!chunk) return;
    // Con voz elegida suena esa variante pregenerada (.v.<voz>); si no existe, el
    // servicio cae a la voz por defecto/navegador.
    const key = voice ? `${chunk.audioKey}.v.${voice}` : chunk.audioKey;
    void audio.speak({ key, text: chunk.text, speakerId });
  }, [audio, chunk, speakerId, voice]);

  // Al entrar a cada fragmento suena solo: copiar es oír primero.
  useEffect(() => {
    play();
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const take = (correct: boolean, rec?: Recording | null) => {
    if (!chunk) return;
    if (rec) clips.current.push(rec);
    if (correct) hits.current += 1;
    const texts = [...built, chunk.text];
    setBuilt(texts);
    if (idx + 1 < chunks.length) setIdx(idx + 1);
    else {
      handedOff.current = true;
      onFinish({ texts, hits: hits.current, clips: clips.current });
    }
  };

  if (!chunk) return null;

  return (
    <div className="shrun">
      <div className="shrun__progress">
        <span>
          {label ? `${label} · ` : ''}Parte {idx + 1} de {chunks.length}
        </span>
        <div className="shrun__bar">
          <span style={{ width: `${(idx / chunks.length) * 100}%` }} />
        </div>
      </div>

      <div className="shrun__seg">
        <button className="shrun__play" onClick={play} aria-label="Escuchar la frase">
          🔊
        </button>
        {audioOnly ? (
          <p className="shrun__blind">
            🎧 Solo audio — escuchá y repetí de oído. El texto aparece al terminar.
          </p>
        ) : (
          <p>{chunk.text}</p>
        )}
      </div>

      {voiceOptions.length > 0 && (
        <div className="shrun__voices">
          <span className="shrun__voices-label">Voz</span>
          <button
            className={'shrun__voice' + (voice === null ? ' shrun__voice--on' : '')}
            onClick={() => setVoice(null)}
          >
            Original
          </button>
          {voiceOptions.map((v) => (
            <button
              key={v.id}
              className={'shrun__voice' + (voice === v.id ? ' shrun__voice--on' : '')}
              onClick={() => setVoice(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <p className="shrun__hint">Escuchala y repetila igual — imitá el ritmo y la entonación.</p>

      <SpeakPanel
        key={idx}
        targets={[chunk.text]}
        neighbourhood={neighbourhood}
        lang={lang}
        onPlayReference={play}
        onDone={take}
      />

      {/* En sombra no se muestra: si se leyera lo ya copiado, dejaría de ser de oído. */}
      {built.length > 0 && !audioOnly && (
        <div className="shrun__soFar">
          <p className="shrun__soFar-label">Lo copiado hasta acá</p>
          <p className="shrun__script">{built.join(' ')}</p>
        </div>
      )}
    </div>
  );
}
