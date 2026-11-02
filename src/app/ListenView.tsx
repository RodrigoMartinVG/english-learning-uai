/**
 * ListenView — Listening continuo: la tira de oraciones que sigue sola.
 *
 * El cuarto modo de la unidad, y el único que no te pide nada. Los otros tres
 * (estudiar, barrer, repasar) son activos: te preguntan y te corrigen. Este no
 * evalúa, no corrige y NO ESCRIBE EN EL SRS — a propósito. Registrar un acierto
 * donde nunca hubo una pregunta le enseñaría al programador de repasos que sabés
 * algo que no te preguntó nadie, y a partir de ahí todas sus fechas serían mentira.
 *
 * Lo que entrena es lo que ningún ejercicio entrena: seguir inglés hablado de
 * corrido, sin saber qué viene, en una voz que no elegiste. Por eso se baraja y
 * por eso cada pasada sortea voz: si la misma oración vuelve siempre en el mismo
 * timbre, lo que se aprende es el clip, no la frase.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../audio/AudioProvider.tsx';
import { manifest, speakerById } from '../data/content.ts';
import { ALT_VOICES } from '../../content/kokoro-voices.ts';
import { played } from '../audio/AudioService.ts';
import { listenItems, type ListenItem } from '../engine/listen.ts';
import { shuffle } from '../shared/shuffle.ts';
import type { Atom, Course } from '../../content/schema.ts';
import './listen.css';

/** Silencio entre pasadas. Corto, pero el suficiente para que no suene pegado. */
const GAP_MS = 650;

/** Cuántas veces suena cada oración antes de pasar a la siguiente. */
const REPEAT_CHOICES = [1, 2, 3, 5] as const;

interface Voice {
  key: string;
  label: string;
}

/**
 * Las voces disponibles para UNA oración: la del personaje más las alternativas
 * que existan pregeneradas. No se inventa ninguna — se ofrece lo que hay en disco,
 * así que una oración con una sola voz simplemente suena siempre igual.
 */
function voicePool(item: ListenItem): Voice[] {
  const out: Voice[] = [
    { key: item.key, label: speakerById.get(item.speakerId)?.displayName ?? 'Original' },
  ];
  for (const v of ALT_VOICES) {
    const k = `${item.key}.v.${v.id}`;
    if (k in manifest.entries) out.push({ key: k, label: v.label });
  }
  return out;
}

export function ListenView({
  atoms,
  course,
  unit,
  title,
}: {
  atoms: Atom[];
  course: Course;
  unit: number;
  title: string;
}) {
  const audio = useAudio();
  const state = useAudioState();

  // Se baraja UNA vez por entrada a la pantalla (y al tocar "barajar"). Si se
  // barajara en cada render, la tira se reordenaría sola mientras suena.
  const [seed, setSeed] = useState(0);
  const items = useMemo(
    () => shuffle(listenItems(atoms, course, unit)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atoms, course, unit, seed]
  );

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [repeats, setRepeats] = useState(2);
  const [hideText, setHideText] = useState(false);
  const [voice, setVoice] = useState<string>('');
  /** Pasada actual dentro del ítem (1..repeats). Para el indicador. */
  const [pass, setPass] = useState(0);

  const item = items[idx];
  const rowRef = useRef<HTMLLIElement | null>(null);
  // La última voz sorteada, para no repetirla dos pasadas seguidas.
  const lastVoice = useRef<string>('');

  /**
   * El motor de la tira: suena el ítem `repeats` veces y avanza.
   *
   * Va en un efecto y no en un callback porque tiene que poder ser CORTADO desde
   * afuera (pausa, saltar, desmontar) en medio de un await. El cleanup marca
   * `cancelado` y corta el audio; cada await vuelve y se encuentra con la marca.
   * Sin eso, dos tiras corren a la vez y la segunda pisa a la primera a mitad de
   * una oración — que es exactamente cómo suena un reproductor roto.
   */
  useEffect(() => {
    if (!playing || !item) return;
    let cancelado = false;

    const dormir = (ms: number) =>
      new Promise<void>((r) => {
        const t = setTimeout(r, ms);
        timers.push(t);
      });
    const timers: ReturnType<typeof setTimeout>[] = [];

    void (async () => {
      const pool = voicePool(item);
      for (let r = 0; r < repeats; r++) {
        // Sortear voz EN CADA PASADA: oír la misma frase en dos timbres seguidos es
        // justo lo que despega la frase del clip que la dice.
        const opciones = pool.length > 1 ? pool.filter((v) => v.key !== lastVoice.current) : pool;
        const v = opciones[Math.floor(Math.random() * opciones.length)] ?? pool[0]!;
        lastVoice.current = v.key;
        setVoice(v.label);
        setPass(r + 1);

        const res = await audio.speak({ key: v.key, text: item.text, speakerId: item.speakerId });
        if (cancelado) return;
        // `interrupted` solo llega si alguien nos pisó, y entonces `cancelado` ya
        // es true. Lo que queda acá es "no había con qué sonar": se sigue de largo
        // en vez de clavar la tira esperando un audio que no existe.
        if (!played(res)) break;

        await dormir(GAP_MS);
        if (cancelado) return;
      }
      setIdx((i) => (i + 1) % items.length);
    })();

    return () => {
      cancelado = true;
      for (const t of timers) clearTimeout(t);
      audio.cancel();
    };
  }, [playing, idx, repeats, item, items.length, audio]);

  // Seguir la oración que suena sin tener que buscarla con el ojo.
  useEffect(() => {
    rowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [idx]);

  const saltar = useCallback(
    (delta: number) => {
      if (!items.length) return;
      setIdx((i) => (i + delta + items.length) % items.length);
    },
    [items.length]
  );

  // Repetir la actual: se corta y se vuelve a lanzar la misma tira desde cero.
  const repetir = useCallback(() => {
    audio.cancel();
    setPlaying(false);
    // En el tick siguiente, para que el efecto se desmonte y vuelva a montar.
    setTimeout(() => setPlaying(true), 0);
  }, [audio]);

  if (!items.length) {
    return (
      <div className="listen">
        <h1 className="listen__title">Listening continuo</h1>
        <p className="listen__empty">
          Esta unidad no tiene oraciones sueltas para escuchar (solo palabras o textos).
        </p>
      </div>
    );
  }

  return (
    <div className="listen">
      <p className="listen__eyebrow">{title}</p>
      <h1 className="listen__title">Listening continuo</h1>
      <p className="listen__lead">
        Oraciones de la unidad en orden al azar y en voces distintas. Sigue sola:{' '}
        <strong>escuchá, no toques nada</strong>. Es la única práctica que no te corrige —
        por eso tampoco cuenta para el repaso.
      </p>

      <div className="listen__bar">
        <button className="btn listen__nav" onClick={() => saltar(-1)} aria-label="Anterior">
          ⏮
        </button>
        <button
          className="btn btn--primary listen__play"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {playing ? '⏸ Pausar' : '▶ Reproducir'}
        </button>
        <button className="btn listen__nav" onClick={() => saltar(1)} aria-label="Siguiente">
          ⏭
        </button>
        <button className="btn listen__nav" onClick={repetir} aria-label="Repetir esta oración">
          🔁
        </button>

        <label className="listen__repeats">
          Repeticiones
          <select value={repeats} onChange={(e) => setRepeats(Number(e.target.value))}>
            {REPEAT_CHOICES.map((n) => (
              <option key={n} value={n}>
                {n}×
              </option>
            ))}
          </select>
        </label>

        <button
          className={'btn listen__toggle' + (hideText ? ' listen__toggle--on' : '')}
          onClick={() => setHideText((h) => !h)}
          title="Tapar el inglés y dejar solo la traducción: listening de verdad"
        >
          {hideText ? '🙈 Inglés tapado' : '👁 Tapar inglés'}
        </button>

        <button className="btn listen__toggle" onClick={() => setSeed((s) => s + 1)} title="Barajar de nuevo">
          🔀
        </button>
      </div>

      <div className="listen__status">
        <span className="listen__count">
          {idx + 1} / {items.length}
        </span>
        {playing && voice && (
          <span className="listen__voice">
            🔊 {voice} · pasada {pass}/{repeats}
          </span>
        )}
        {state === 'speaking' && <span className="listen__dot" aria-hidden="true" />}
      </div>

      <ol className="listen__list">
        {items.map((it, i) => (
          <li
            key={it.key + i}
            ref={i === idx ? rowRef : null}
            className={'listen__item' + (i === idx ? ' listen__item--on' : '')}
            onClick={() => setIdx(i)}
          >
            <span className="listen__num">{i + 1}</span>
            <span className="listen__en">
              {/* Tapado: se oculta lo que todavía no sonó (la actual incluida) y se
                  revela lo ya pasado. Así cada oración se entiende de oído y recién
                  después se puede verificar — tapar TODO dejaría sin control. */}
              {hideText && i >= idx ? '· · ·' : it.text}
              {it.source === 'text' && (
                <span className="listen__from" title={it.from}>
                  texto
                </span>
              )}
            </span>
            <span className="listen__es">{it.gloss ?? ''}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
