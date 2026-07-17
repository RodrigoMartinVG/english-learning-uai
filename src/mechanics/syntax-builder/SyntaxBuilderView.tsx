/**
 * SyntaxBuilderView — armar la frase con fichas.
 *
 * Doble interacción a propósito: se puede ARRASTRAR (mouse) y también TOCAR
 * (dedo y teclado). El drag & drop nativo del navegador no existe en móvil, y
 * dejar la mecánica solo para escritorio sería perder la mitad de las sesiones.
 * Tocar una ficha del banco la agrega al final; tocarla en la respuesta la
 * devuelve. Arrastrar permite además insertar en el medio.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { normalize } from '../../engine/grading/speech.ts';
import type { MechanicViewProps } from '../types.ts';
import type { SyntaxRound } from './mechanic.ts';
import './syntax-builder.css';

interface Chip {
  id: number;
  word: string;
}

export function SyntaxBuilderView({ round, onDone }: MechanicViewProps<SyntaxRound>) {
  const audio = useAudio();
  const state = useAudioState();

  // Las palabras se repiten ("is", "the"): la ficha necesita id propio o
  // React y el drag confunden cuál es cuál.
  const all = useMemo<Chip[]>(() => round.chips.map((word, id) => ({ id, word })), [round.chips]);

  const [answer, setAnswer] = useState<Chip[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [dragId, setDragId] = useState<number | null>(null);

  const bank = all.filter((c) => !answer.some((a) => a.id === c.id));

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({
        key: round.audioKey,
        text: round.targets[0]!,
        speakerId: round.speakerId,
        rateFactor,
      }),
    [audio, round]
  );

  // Suena primero: la mecánica es auditiva, el orden se deduce de lo que se oyó.
  useEffect(() => {
    setAnswer([]);
    setChecked(null);
    play();
    return () => audio.cancel();
  }, [round, play, audio]);

  const add = (chip: Chip, at = answer.length) => {
    if (checked !== null) return;
    setAnswer((prev) => {
      const without = prev.filter((c) => c.id !== chip.id);
      const idx = Math.min(at, without.length);
      return [...without.slice(0, idx), chip, ...without.slice(idx)];
    });
  };

  const remove = (chip: Chip) => {
    if (checked !== null) return;
    setAnswer((prev) => prev.filter((c) => c.id !== chip.id));
  };

  const check = () => {
    const said = normalize(answer.map((c) => c.word).join(' '));
    setChecked(round.targets.some((t) => normalize(t) === said));
    audio.cancel();
  };

  const onDrop = (at: number) => {
    const chip = all.find((c) => c.id === dragId);
    setDragId(null);
    if (chip) add(chip, at);
  };

  const correct = round.targets[0]!;

  return (
    <div className="sb">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={() => play()}>
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar'}
          </button>
          <button className="btn" onClick={() => play(0.7)}>
            🐢 Lento
          </button>
        </div>
        <p className="osmosis__hint">
          {round.origin === 'material'
            ? 'Ejercicio del TP · escuchá y armá la pregunta'
            : 'Escuchá y reconstruí la frase'}
        </p>
      </div>

      {/* La respuesta. Se puede soltar acá o tocar fichas del banco. */}
      <div
        className={
          'sb__answer' +
          (checked === true ? ' sb__answer--ok' : '') +
          (checked === false ? ' sb__answer--bad' : '')
        }
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(answer.length)}
        aria-label="Tu respuesta"
      >
        {answer.length === 0 && <span className="sb__placeholder">Arrastrá o tocá las palabras</span>}
        {answer.map((chip, i) => (
          <button
            key={chip.id}
            className="sb__chip sb__chip--placed"
            draggable={checked === null}
            onDragStart={() => setDragId(chip.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.stopPropagation();
              onDrop(i);
            }}
            onClick={() => remove(chip)}
            disabled={checked !== null}
          >
            {chip.word}
          </button>
        ))}
      </div>

      <div className="sb__bank" onDragOver={(e) => e.preventDefault()}>
        {bank.map((chip) => (
          <button
            key={chip.id}
            className="sb__chip"
            draggable={checked === null}
            onDragStart={() => setDragId(chip.id)}
            onClick={() => add(chip)}
            disabled={checked !== null}
          >
            {chip.word}
          </button>
        ))}
        {bank.length === 0 && checked === null && (
          <span className="sb__placeholder">Usaste todas las palabras</span>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {checked === true ? 'Correcto' : checked === false ? `Incorrecto. Era: ${correct}` : ''}
      </div>

      {checked === null ? (
        <div className="ab">
          <button className="btn" onClick={() => setAnswer([])} disabled={!answer.length}>
            Limpiar
          </button>
          <button className="btn btn--primary" onClick={check} disabled={bank.length > 0}>
            Comprobar
          </button>
        </div>
      ) : (
        <div className="expansion">
          <p className={'verdict ' + (checked ? 'verdict--ok' : 'verdict--bad')}>
            {checked ? 'Correcto' : 'Ese no es el orden'}
          </p>
          {!checked && <p className="sb__solution">{correct}</p>}
          {round.targets.length > 1 && checked && (
            <p className="speak__note">También vale: {round.targets.slice(1).join(' · ')}</p>
          )}
          <div className="ab">
            <button className="btn" onClick={() => play()}>
              🔊 Escuchar
            </button>
            <button className="btn btn--primary" onClick={() => onDone(checked)} autoFocus>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
