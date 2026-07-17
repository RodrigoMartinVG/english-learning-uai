/**
 * Recorder.ts — graba la voz del alumno para el cotejo A/B.
 *
 * Ver ARQUITECTURA.md §6.4. Es la tercera señal, y la más honesta: el navegador
 * no puntúa fonemas, pero el propio oído del alumno sí distingue su "th" del de
 * la referencia si los escucha uno detrás del otro. Es lo que hacen los
 * intérpretes profesionales, y es gratis.
 */

export interface Recording {
  url: string;
  /** Liberar el object URL. Sin esto, una sesión larga acumula blobs. */
  revoke(): void;
}

export function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export interface VoiceRecorder {
  start(): Promise<void>;
  stop(): Promise<Recording | null>;
  cancel(): void;
}

export function createRecorder(): VoiceRecorder {
  let rec: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];

  const release = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    rec = null;
    chunks = [];
  };

  return {
    async start() {
      if (!isRecordingSupported()) return;
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start();
    },

    stop() {
      return new Promise<Recording | null>((resolve) => {
        if (!rec || rec.state === 'inactive') {
          release();
          return resolve(null);
        }
        rec.onstop = () => {
          const blob = new Blob(chunks, { type: chunks[0]?.type ?? 'audio/webm' });
          release();
          if (!blob.size) return resolve(null);
          const url = URL.createObjectURL(blob);
          resolve({ url, revoke: () => URL.revokeObjectURL(url) });
        };
        rec.stop();
      });
    },

    cancel() {
      if (rec && rec.state !== 'inactive') {
        rec.onstop = null;
        rec.stop();
      }
      release();
    },
  };
}
