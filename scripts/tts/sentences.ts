/**
 * sentences.ts — re-exporta el partidor compartido (`content/sentences.ts`), para
 * que build-time (TTS) y runtime (copiar/reconstruir versiones) partan IGUAL.
 */

export { splitSentences } from '../../content/sentences.ts';
