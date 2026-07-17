/**
 * FlagAudioButton — marcar el último audio que sonó como robótico o mal dicho.
 *
 * Marca lo ÚLTIMO reproducido, no un audio fijo: así una sola instancia sirve en
 * cualquier vista sin que cada mecánica tenga que pasar su clave. El alumno acaba
 * de oír algo raro → toca la banderita → queda registrado con su voz exacta.
 *
 * No marca la voz de fallback del navegador: esa no la generamos, no hay nada
 * que cambiar. Por eso se deshabilita hasta que suene un archivo nuestro.
 */

import { useSyncExternalStore } from 'react';
import { useAudio, useAudioState } from '../audio/AudioProvider.tsx';
import { isFlagged, subscribeFlags, toggleFlag } from '../data/flags.ts';
import './flag.css';

export function FlagAudioButton() {
  const audio = useAudio();
  // Re-render al marcar y al cambiar de audio (el estado cambia en cada speak()).
  useAudioState();
  useSyncExternalStore(subscribeFlags, () => isFlagged(audio.getLastPlayed()?.key ?? ''));

  const last = audio.getLastPlayed();
  const canFlag = last?.source === 'file';
  const flagged = canFlag && isFlagged(last.key);

  return (
    <button
      className={'flagbtn' + (flagged ? ' flagbtn--on' : '')}
      onClick={() =>
        last && canFlag && toggleFlag({ audioKey: last.key, text: last.text, speakerId: last.speakerId })
      }
      disabled={!canFlag}
      title={
        !canFlag
          ? 'Reproducí un audio para poder marcarlo'
          : flagged
            ? 'Audio marcado como que suena mal — tocá para desmarcar'
            : 'Este audio suena robótico o mal pronunciado'
      }
      aria-pressed={flagged}
      aria-label="Marcar audio que suena mal"
    >
      {flagged ? '🚩' : '⚐'}
    </button>
  );
}
