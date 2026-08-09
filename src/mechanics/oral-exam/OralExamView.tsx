/**
 * OralExamView — el simulacro de final oral.
 *
 * Tres formas de encararlo, y la diferencia es el punto:
 *  · examen    → nada en pantalla, reloj corriendo. Para medir.
 *  · warm-up   → banco de palabras a la vista, sin reloj. Para construir.
 *  · shadowing → el modelo parte por parte: oís un fragmento y lo repetís.
 *
 * El shadowing existe porque decir el modelo entero de memoria es un salto muy
 * grande: si todavía no lo tenés, el examen no entrena, frustra. Copiándolo
 * fragmento a fragmento se construye la misma producción por pedazos, y desde
 * ahí se pasa a rendirlo de memoria.
 *
 * Al terminar no dice "bien" ni "mal": muestra la transcripción, qué estructuras
 * de la rúbrica aparecieron, y deja escuchar la grabación. Un examinador no te
 * da un puntaje de pronunciación inventado; te dice qué te faltó.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { ShadowRun, type ShadowResult } from '../../ui/ShadowRun.tsx';
import { createRecognizer, isRecognitionSupported } from '../../audio/Recognition.ts';
import { createRecorder, isRecordingSupported, type Recording } from '../../audio/Recorder.ts';
import { grammarHints } from '../../engine/grading/speech.ts';
import { versionChunks } from '../../data/reference.ts';
import { checkRubric, type RubricCheck } from './mechanic.ts';
import type { MechanicViewProps } from '../types.ts';
import type { OralExamRound } from './mechanic.ts';
import './oral-exam.css';

type Phase = 'brief' | 'asking' | 'answering' | 'report' | 'shadow' | 'shadow-report';

export function OralExamView({ round, onDone }: MechanicViewProps<OralExamRound>) {
  const { target } = round;
  const audio = useAudio();
  const audioState = useAudioState();
  const recognizer = useRef(createRecognizer()).current;
  const recorder = useRef(createRecorder()).current;

  const [phase, setPhase] = useState<Phase>('brief');
  const [warmUp, setWarmUp] = useState(false);
  const [blind, setBlind] = useState(false); // shadowing sin ver el texto
  const [interim, setInterim] = useState('');
  const [transcript, setTranscript] = useState('');
  const [checks, setChecks] = useState<RubricCheck[]>([]);
  const [mine, setMine] = useState<Recording | null>(null);
  const [secs, setSecs] = useState(0);
  const [copied, setCopied] = useState<ShadowResult | null>(null);

  // Los fragmentos del modelo, partidos igual que en el build de audio: cada uno
  // tiene su mp3, así que la copia suena con la voz del curso y no con la del
  // navegador. Sin `steps` no hay por dónde cortar, y el shadowing no se ofrece.
  const chunks = useMemo(() => versionChunks(target, 0), [target]);

  useEffect(
    () => () => {
      recognizer.abort();
      recorder.cancel();
      audio.cancel();
      mine?.revoke();
    },
    [recognizer, recorder, audio, mine]
  );

  // Las grabaciones del shadowing: ShadowRun nos las cede, las revocamos nosotros.
  useEffect(() => () => copied?.clips.forEach((c) => c.revoke()), [copied]);

  useEffect(() => {
    if (phase !== 'answering') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const ask = useCallback(async () => {
    setPhase('asking');
    await audio.speak({ key: target.id, text: target.prompt, speakerId: target.speaker });
    setPhase('answering');
    setSecs(0);

    if (isRecordingSupported()) {
      try {
        await recorder.start();
      } catch {
        /* sin grabación se puede rendir igual */
      }
    }

    try {
      const { transcript: said } = await recognizer.listen({
        lang: 'en-US',
        // continuous: sin esto el examen se corta en la primera respiración.
        continuous: true,
        leadMs: 10000,
        silenceMs: 4000,
        hints: grammarHints([target.modelAnswer, ...(target.wordBank ?? [])]),
        onInterim: setInterim,
      });
      const rec = await recorder.stop();
      setMine(rec);
      setTranscript(said);
      setChecks(checkRubric(target, said));
      setInterim('');
      setPhase('report');
    } catch {
      recorder.cancel();
      setPhase('report');
      setChecks(checkRubric(target, ''));
    }
  }, [audio, recognizer, recorder, target]);

  /** Tu versión hablada del modelo: los fragmentos grabados, en orden. */
  const playClips = useCallback(
    async (clips: Recording[]) => {
      for (const c of clips) {
        if ((await audio.playClip(c.url)) === 'interrupted') break;
      }
    },
    [audio]
  );

  if (!isRecognitionSupported()) {
    return (
      <div className="speak speak--blocked">
        <p>
          El examen oral necesita micrófono. Probá <strong>Chrome</strong> o <strong>Edge</strong>.
        </p>
        <button className="btn btn--wide" onClick={() => onDone(false)}>
          Saltear
        </button>
      </div>
    );
  }

  if (phase === 'brief') {
    return (
      <div className="exam">
        <p className="exam__eyebrow">
          {target.chapter ? `My Life · Capítulo ${target.chapter}` : 'Producción oral'}
        </p>
        <h2>Simulacro de final oral</h2>
        <p className="exam__note">
          El examinador va a hacerte una consigna. Vas a tener que hablar sin leer nada. Podés
          escucharla otra vez, pero no vas a ver el texto.
        </p>

        <div className="exam__choice">
          <button className="btn btn--primary btn--wide" onClick={() => void ask()} autoFocus>
            🎤 Rendirlo de memoria →
          </button>
          <p className="exam__choice-note">Como el final: la consigna, y hablás de corrido.</p>
          <label className="exam__toggle">
            <input type="checkbox" checked={warmUp} onChange={(e) => setWarmUp(e.target.checked)} />
            <span>
              Modo ensayo: dejar a la vista el banco de palabras y la rúbrica.{' '}
              <em>Sin esto, es como el final.</em>
            </span>
          </label>
        </div>

        {/* La rampa: si el modelo todavía no está en la cabeza, se lo copia por partes
            en vez de abandonar el ejercicio. Ver el encabezado de este archivo. */}
        {chunks.length >= 2 && (
          <div className="exam__choice">
            <button className="btn btn--wide" onClick={() => setPhase('shadow')}>
              🗣 Copiarlo parte por parte (shadowing) →
            </button>
            <p className="exam__choice-note">
              Oís cada fragmento del modelo y lo repetís. No hace falta acordarse de nada:
              son {chunks.length} partes cortas.
            </p>
            <label className="exam__toggle">
              <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} />
              <span>
                Solo audio (sombra): <strong>sin ver el texto</strong>.{' '}
                <em>Escuchás y repetís de oído.</em>
              </span>
            </label>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'shadow') {
    return (
      <div className="exam">
        <p className="exam__eyebrow">Shadowing · copia guiada</p>
        <ShadowRun
          chunks={chunks}
          speakerId={target.speaker}
          audioOnly={blind}
          onFinish={(r) => {
            setCopied(r);
            setPhase('shadow-report');
          }}
        />
      </div>
    );
  }

  if (phase === 'shadow-report' && copied) {
    const total = chunks.length;
    return (
      <div className="exam">
        <p className="exam__eyebrow">Copia terminada</p>
        <h2>
          {copied.hits} de {total} partes
        </h2>
        <p className="exam__note">
          Es lo que tomó el micrófono, no una nota de pronunciación: ningún navegador puede darla.
        </p>

        {/* Los fragmentos concatenados SON el modelo: un solo bloque, y el A/B al lado. */}
        <section className="exam__block">
          <h3>El guion que copiaste</h3>
          <p className="exam__model">{copied.texts.join(' ')}</p>
          <div className="ab">
            {copied.clips.length > 0 && (
              <button className="btn" onClick={() => void playClips(copied.clips)}>
                🎤 Vos, parte por parte
              </button>
            )}
            <button
              className="btn"
              onClick={() =>
                void audio.speak({
                  key: `${target.id}.model`,
                  text: target.modelAnswer,
                  speakerId: target.speaker,
                })
              }
            >
              🔊 El modelo, de corrido
            </button>
          </div>
        </section>

        <div className="ab">
          <button className="btn" onClick={() => setPhase('brief')}>
            Ahora rendirlo de memoria
          </button>
          <button
            className="btn btn--primary"
            onClick={() => onDone(copied.hits === total)}
            autoFocus
          >
            Terminar →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'asking' || phase === 'answering') {
    return (
      <div className="exam">
        <Waveform active={audioState === 'speaking' || phase === 'answering'} />
        {phase === 'asking' ? (
          <p className="exam__status">El examinador está hablando…</p>
        ) : (
          <>
            <div className="exam__live">
              <span className="exam__rec" aria-hidden="true" />
              <span className="exam__timer">
                {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
              </span>
            </div>
            <p className="exam__interim" aria-live="polite">
              {interim || 'Hablá. Cuando te quedes en silencio unos segundos, se cierra.'}
            </p>
          </>
        )}

        <button className="btn" onClick={() => void audio.speak({ key: target.id, text: target.prompt, speakerId: target.speaker })}>
          ▶ Repetir la consigna
        </button>

        {warmUp && (
          <div className="exam__aid">
            {/* El esquema de la exposición: el andamiaje que se apoya en ensayo y se
                retira en el examen real (Unidad 5, capa 6). */}
            {target.scaffold?.length ? (
              <>
                <h3>Esquema de la exposición</h3>
                <ol className="exam__scaffold">
                  {target.scaffold.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </>
            ) : null}
            {target.wordBank?.length ? (
              <>
                <h3>Banco de palabras</h3>
                <p className="exam__bank">{target.wordBank.join(' · ')}</p>
              </>
            ) : null}
            <h3>Se espera que uses</h3>
            <ul className="exam__rubric">
              {target.rubric.map((r) => (
                <li key={r.text}>{r.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const detected = checks.filter((c) => c.hit === true).length;
  const detectable = checks.filter((c) => c.hit !== null).length;

  return (
    <div className="exam">
      <p className="exam__eyebrow">Informe</p>
      <h2>
        {detected} de {detectable} estructuras
      </h2>

      <section className="exam__block">
        <h3>Qué dijiste</h3>
        <p className="exam__transcript">{transcript || '— no se oyó nada —'}</p>
      </section>

      <section className="exam__block">
        <h3>Contra la rúbrica</h3>
        <ul className="exam__checks">
          {checks.map((c) => (
            <li key={c.text} className={c.hit === true ? 'hit' : c.hit === false ? 'miss' : 'self'}>
              <span aria-hidden="true">{c.hit === true ? '✓' : c.hit === false ? '✗' : '?'}</span>
              {c.text}
              {/* Honestidad: lo que no se puede detectar, no se finge. */}
              {c.hit === null && <em> — revisalo vos en la transcripción</em>}
            </li>
          ))}
        </ul>
      </section>

      {mine && (
        <section className="exam__block">
          <h3>Escuchate</h3>
          <div className="ab">
            <button className="btn" onClick={() => void audio.playClip(mine.url)}>
              🎤 Tu respuesta
            </button>
            <button
              className="btn"
              onClick={() =>
                void audio.speak({
                  key: `${target.id}.model`,
                  text: target.modelAnswer,
                  speakerId: target.speaker,
                })
              }
            >
              🔊 Respuesta modelo
            </button>
          </div>
        </section>
      )}

      <section className="exam__block">
        <h3>Modelo</h3>
        <p className="exam__model">{target.modelAnswer}</p>
      </section>

      <div className="ab">
        <button className="btn" onClick={() => setPhase('brief')}>
          Rendir de nuevo
        </button>
        <button className="btn btn--primary" onClick={() => onDone(detected === detectable)} autoFocus>
          Terminar →
        </button>
      </div>
    </div>
  );
}
