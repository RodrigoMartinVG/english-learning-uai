/**
 * ContinuousPlayer — escuchar un texto de corrido, frase por frase, repitiendo
 * cada una N veces antes de pasar a la siguiente. Para asimilar por escucha, sin
 * tocar un botón entre frases.
 *
 * Encadena `audio.speak()` (que resuelve al terminar el clip) frase por frase.
 * Pausar usa `audio.pause()`, que NO resuelve el speak() en curso: el loop queda
 * "estacionado" en el await hasta `resume()`. Detener corta con `cancel()`, que
 * resuelve el speak() como `interrupted` → el loop lo ve y corta.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioProvider.tsx';
import { MODEL_VOICES } from '../../content/kokoro-voices.ts';
import type { ScriptChunk } from '../data/reference.ts';
import './continuous.css';

const REPEATS_KEY = 'oda.continuous.repeats';
const MIN_REPEATS = 1;
const MAX_REPEATS = 6;
const clampRepeats = (n: number) => Math.min(MAX_REPEATS, Math.max(MIN_REPEATS, n));

function loadRepeats(): number {
  const v = Number(localStorage.getItem(REPEATS_KEY));
  return v ? clampRepeats(v) : 3;
}

export function ContinuousPlayer({ chunks, speakerId }: { chunks: ScriptChunk[]; speakerId: string }) {
  const audio = useAudio();
  const [open, setOpen] = useState(false);
  const [repeats, setRepeats] = useState(loadRepeats);
  const [voice, setVoice] = useState<string | null>(null);
  const [loopAll, setLoopAll] = useState(false);
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [pos, setPos] = useState({ chunk: 0, rep: 0 });

  // Valores vivos para el loop async (evita cerrar sobre estado viejo).
  const stopRef = useRef(false);
  const runningRef = useRef(false);
  const repeatsRef = useRef(repeats);
  const voiceRef = useRef(voice);
  const loopAllRef = useRef(loopAll);
  useEffect(() => {
    repeatsRef.current = repeats;
  }, [repeats]);
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);
  useEffect(() => {
    loopAllRef.current = loopAll;
  }, [loopAll]);

  // Voces con clip por-frase para TODAS las oraciones (si falta alguna, esa frase
  // caería a la voz del navegador). Solo ofrecemos las que están completas.
  const voices = useMemo(
    () =>
      MODEL_VOICES.filter(
        (v) => chunks.length > 0 && chunks.every((c) => audio.hasFile(`${c.audioKey}.v.${v.id}`))
      ),
    [chunks, audio]
  );

  // Cortar al desmontar / navegar.
  useEffect(
    () => () => {
      stopRef.current = true;
      audio.cancel();
    },
    [audio]
  );

  const finish = useCallback(() => {
    runningRef.current = false;
    setStatus('idle');
    setPos({ chunk: 0, rep: 0 });
  }, []);

  const run = useCallback(
    async (fromChunk = 0) => {
      if (runningRef.current || !chunks.length) return;
      runningRef.current = true;
      stopRef.current = false;
      setStatus('playing');
      do {
        for (let ci = fromChunk; ci < chunks.length; ci++) {
          const c = chunks[ci]!;
          const key = voiceRef.current ? `${c.audioKey}.v.${voiceRef.current}` : c.audioKey;
          for (let r = 0; r < repeatsRef.current; r++) {
            if (stopRef.current) return finish();
            setPos({ chunk: ci, rep: r });
            const res = await audio.speak({ key, text: c.text, speakerId });
            if (stopRef.current) return finish();
            // Otro audio (o un cancel externo) pisó el nuestro: cortamos con elegancia.
            if (res === 'interrupted') return finish();
          }
        }
        fromChunk = 0;
      } while (loopAllRef.current && !stopRef.current);
      finish();
    },
    [audio, chunks, speakerId, finish]
  );

  const pause = () => {
    audio.pause();
    setStatus('paused');
  };
  const resume = () => {
    audio.resume();
    setStatus('playing');
  };
  const stop = () => {
    stopRef.current = true;
    audio.cancel();
  };

  const changeRepeats = (n: number) => {
    const v = clampRepeats(n);
    setRepeats(v);
    localStorage.setItem(REPEATS_KEY, String(v));
  };

  if (!chunks.length) return null;

  return (
    <div className="contplay">
      <button className="contplay__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        🔁 Audio continuo {open ? '▾' : '▸'}
      </button>

      {open && (
        <div className="contplay__panel">
          <p className="contplay__note">
            Escuchá el texto de corrido: cada frase se repite unas veces antes de pasar a la
            siguiente, para asimilarla sin tocar nada.
          </p>

          <div className="contplay__row">
            <span className="contplay__label">Repeticiones por frase</span>
            <div className="contplay__stepper">
              <button onClick={() => changeRepeats(repeats - 1)} disabled={repeats <= MIN_REPEATS} aria-label="menos">
                −
              </button>
              <strong>{repeats}</strong>
              <button onClick={() => changeRepeats(repeats + 1)} disabled={repeats >= MAX_REPEATS} aria-label="más">
                +
              </button>
            </div>
          </div>

          {voices.length > 0 && (
            <div className="contplay__row">
              <span className="contplay__label">Voz</span>
              <div className="contplay__voices">
                <button
                  className={voice === null ? 'contplay__voice contplay__voice--on' : 'contplay__voice'}
                  onClick={() => setVoice(null)}
                >
                  Base
                </button>
                {voices.map((v) => (
                  <button
                    key={v.id}
                    className={voice === v.id ? 'contplay__voice contplay__voice--on' : 'contplay__voice'}
                    onClick={() => setVoice(v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="contplay__loop">
            <input type="checkbox" checked={loopAll} onChange={(e) => setLoopAll(e.target.checked)} />
            Repetir todo al terminar
          </label>

          <div className="contplay__controls">
            {status === 'idle' && (
              <button className="contplay__btn contplay__btn--play" onClick={() => run(0)}>
                ▶ Reproducir
              </button>
            )}
            {status === 'playing' && (
              <button className="contplay__btn contplay__btn--play" onClick={pause}>
                ⏸ Pausar
              </button>
            )}
            {status === 'paused' && (
              <button className="contplay__btn contplay__btn--play" onClick={resume}>
                ▶ Continuar
              </button>
            )}
            {status !== 'idle' && (
              <button className="contplay__btn contplay__btn--stop" onClick={stop}>
                ⏹ Detener
              </button>
            )}
          </div>

          {status !== 'idle' && (
            <div className="contplay__now">
              <div className="contplay__progress">
                Frase {pos.chunk + 1} de {chunks.length} · repetición {pos.rep + 1} de {repeats}
              </div>
              <p className="contplay__sentence">{chunks[pos.chunk]?.text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
