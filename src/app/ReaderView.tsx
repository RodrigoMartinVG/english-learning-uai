/**
 * ReaderView — el texto de estudio como recurso (Unidad 5, capa 1: Encuentro).
 *
 * Muestra el texto tal cual, con sus figuras y su atribución, y deja escucharlo
 * párrafo por párrafo (con voces alternativas). No es una tarjeta de SRS ni una
 * mecánica: es el recurso del que el alumno se va a apropiar en las capas siguientes.
 *
 * El texto original NUNCA queda inaccesible: cada figura trae su alt, y el crédito
 * al autor/fuente está siempre a la vista. Ver PLAN-unidad-5 §3.2.
 */

import { readingBlockKey, type ReadingAtom, type ReadingBlock } from '../../content/schema.ts';
import { useAudio } from '../audio/AudioProvider.tsx';
import { AltVoices } from '../ui/AltVoices.tsx';
import './reader.css';

export function ReaderView({ atom, onBack }: { atom: ReadingAtom; onBack: () => void }) {
  return (
    <div className="reader">
      <p className="home__eyebrow">Texto de estudio</p>
      <h1 className="reader__title">{atom.title}</h1>
      <p className="reader__credit">
        {atom.credit.author && <>{atom.credit.author} · </>}
        <a href={atom.credit.url} target="_blank" rel="noopener noreferrer">
          {atom.credit.publication}
        </a>
      </p>

      <p className="reader__hint">
        Leelo con calma. Tocá 🔊 en cada párrafo para escucharlo, y probá otras voces. En las
        prácticas de abajo te vas a ir apropiando de él.
      </p>

      {atom.sections.map((sec, si) => (
        <section key={si} className="reader__section">
          {sec.heading && <h2 className="reader__heading">{sec.heading}</h2>}
          {sec.blocks.map((b, bi) => (
            <Block key={bi} block={b} audioKey={readingBlockKey(atom.id, si, bi)} speakerId={atom.speaker} />
          ))}
        </section>
      ))}

      {atom.afterReadingTask && (
        <aside className="reader__task">
          <p className="reader__task-label">Después de leer</p>
          <p>{atom.afterReadingTask}</p>
        </aside>
      )}

      <button className="btn btn--wide" onClick={onBack}>
        ← Volver al texto
      </button>
    </div>
  );
}

function Block({
  block,
  audioKey,
  speakerId,
}: {
  block: ReadingBlock;
  audioKey: string;
  speakerId: string;
}) {
  const audio = useAudio();

  if (block.kind === 'figure') {
    return (
      <figure className="reader__figure">
        <img src={block.image.src} alt={block.image.alt} loading="lazy" />
        {block.caption && (
          <figcaption>
            <Play onClick={() => void audio.speak({ key: audioKey, text: block.caption!, speakerId })} />
            <span>{block.caption}</span>
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.kind === 'list') {
    const spoken = block.items.join('. ');
    return (
      <div className="reader__block">
        <Play onClick={() => void audio.speak({ key: audioKey, text: spoken, speakerId })} />
        <ul className="reader__list">
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
    );
  }

  // párrafo
  return (
    <div className="reader__block">
      <Play onClick={() => void audio.speak({ key: audioKey, text: block.text, speakerId })} />
      <div className="reader__para">
        <p>{block.text}</p>
        <AltVoices audioKey={audioKey} text={block.text} speakerId={speakerId} />
      </div>
    </div>
  );
}

function Play({ onClick }: { onClick: () => void }) {
  return (
    <button className="reader__play" onClick={onClick} aria-label="Escuchar">
      🔊
    </button>
  );
}
