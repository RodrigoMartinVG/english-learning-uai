/**
 * AudioProvider — expone el AudioService a React.
 *
 * Un solo servicio para toda la app: es lo que garantiza que nunca suenen dos
 * voces a la vez, sin importar qué componente pida audio.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createAudioService, type AudioService, type AudioState } from './AudioService.ts';
import { manifest, voiceHints } from '../data/content.ts';

const Ctx = createContext<AudioService | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => createAudioService(manifest, voiceHints), []);
  // Si el usuario se va de la página con algo sonando, se corta.
  useEffect(() => () => service.cancel(), [service]);
  return <Ctx.Provider value={service}>{children}</Ctx.Provider>;
}

export function useAudio(): AudioService {
  const s = useContext(Ctx);
  if (!s) throw new Error('useAudio fuera de <AudioProvider>');
  return s;
}

export function useAudioState(): AudioState {
  const service = useAudio();
  const [state, setState] = useState<AudioState>(service.getState());
  useEffect(() => service.subscribe(setState), [service]);
  return state;
}
