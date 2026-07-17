/**
 * build-audio.ts — genera el audio de todos los átomos. Ver ARQUITECTURA.md §5.2.
 *
 * Incremental por hash: si el texto, la voz y la velocidad no cambiaron, no se
 * vuelve a sintetizar. Cambiar una frase cuesta un archivo, no cuatrocientos.
 *
 * El contenido NO se toca: los mp3 y el manifest son derivados. El manifest es
 * el índice que la app cruza con los átomos en runtime.
 *
 * Proveedor por defecto: Kokoro, local y libre. No hace falta ninguna credencial.
 *
 * Uso:
 *   npm run build:audio -- --dry-run          reporta qué haría, sin sintetizar
 *   npm run build:audio                       sintetiza lo que falta (Kokoro)
 *   npm run build:audio -- --force            re-sintetiza todo
 *   npm run build:audio -- --only=en1.u1.p    filtra por prefijo de clave
 *   npm run build:audio -- --provider=azure   usa Azure (necesita .env)
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  speakersFileSchema,
  unitFileSchema,
  BLANK,
  type Atom,
  type Speaker,
} from '../content/schema.ts';
import { createAzureProvider } from './tts/azure.ts';
import { createKokoroProvider } from './tts/kokoro.ts';
import { splitSentences } from './tts/sentences.ts';
import { ALT_VOICES } from '../content/kokoro-voices.ts';
import type { ProviderId, TtsProvider, Utterance } from './tts/provider.ts';

const ROOT = join(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const AUDIO_DIR = join(ROOT, 'public', 'audio');
const MANIFEST_PATH = join(AUDIO_DIR, 'audio-manifest.json');

/** Cuánto más lenta es la variante lenta. No es time-stretch: el TTS re-articula. */
const SLOW_RATE_FACTOR = 0.75;

/** Las mecánicas de percepción necesitan una voz neutra y clara, no un personaje. */
const NEUTRAL_SPEAKER = 'narrator';

// Voces alternativas para "escuchar en otra voz": fuente única compartida con la UI.

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const ONLY = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const PROVIDER_ID = (args.find((a) => a.startsWith('--provider='))?.slice('--provider='.length) ??
  'kokoro') as ProviderId;

if (PROVIDER_ID !== 'kokoro' && PROVIDER_ID !== 'azure') {
  console.error(`✗ proveedor desconocido: "${PROVIDER_ID}". Usá kokoro (default) o azure.`);
  process.exit(1);
}

/* ────────────────────────────────── carga ───────────────────────────────────────── */

const speakers = new Map<string, Speaker>();
for (const s of speakersFileSchema.parse(JSON.parse(readFileSync(join(CONTENT_DIR, 'speakers.json'), 'utf8')))
  .speakers) {
  speakers.set(s.id, s);
}

const atoms: Atom[] = [];
for (const course of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
  if (!course.isDirectory()) continue;
  const dir = join(CONTENT_DIR, course.name);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    atoms.push(...unitFileSchema.parse(JSON.parse(readFileSync(join(dir, f), 'utf8'))).atoms);
  }
}

const byId = new Map(atoms.map((a) => [a.id, a]));

/* ──────────────────────────── recolección de emisiones ──────────────────────────── */

/**
 * En Azure el xml:lang sale de la VOZ, no del contenido.
 *
 * Es deliberado: para los acentos no nativos le damos texto en inglés a una voz
 * portuguesa/alemana/rusa. Con el locale de la voz, Azure lo lee con la fonología
 * de ese idioma → inglés con acento. Es una aproximación, no un modelo real de
 * interlengua, pero es lo más cerca que se llega sin grabar hablantes reales.
 * Kokoro ignora este campo: su voz ya fija el idioma.
 */
function langOf(voice: string): string {
  const parts = voice.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : 'en-US';
}

const utterances: Utterance[] = [];
const missingVoice: string[] = [];

function push(key: string, text: string, speakerId: string, rateFactor = 1): void {
  const sp = speakers.get(speakerId);
  if (!sp) {
    missingVoice.push(`${key} → speaker "${speakerId}" no existe`);
    return;
  }
  const voice = PROVIDER_ID === 'azure' ? sp.voice.azure : sp.voice.kokoro;
  if (!voice) {
    missingVoice.push(`${key} → speaker "${speakerId}" no tiene voz para "${PROVIDER_ID}"`);
    return;
  }
  const clean = text.trim();
  if (!clean) return;
  utterances.push({
    key,
    text: clean,
    voice,
    rate: Number((sp.rate * rateFactor).toFixed(3)),
    lang: PROVIDER_ID === 'azure' ? langOf(voice) : sp.accent,
  });
}

/** Longitud máxima para tener voces alternativas: por encima son narraciones. */
const ALT_MAX_CHARS = 110;

/**
 * ¿Esta emisión merece voces alternativas?
 *
 * Casi todo el habla las tiene, para que el alumno pueda oír cualquier frase en
 * otro timbre. Se excluyen solo los casos donde no aportan o son un derroche:
 *  · diálogos A:/B: (ya tienen dos voces)
 *  · variantes .slow (misma voz más lenta: sería redundante)
 *  · variantes de frase .alt.N (contenido secundario del panel de expansión)
 *  · narraciones largas (>110 chars): 3× de audio para un ejercicio de un solo relator
 *  · alt-de-alt (una clave que ya es alternativa)
 */
function wantsAlts(u: Utterance): boolean {
  return (
    PROVIDER_ID === 'kokoro' &&
    !u.segments &&
    u.text.length <= ALT_MAX_CHARS &&
    !u.key.includes('.v.') &&
    !u.key.includes('.alt.') &&
    !u.key.endsWith('.slow')
  );
}

/** Rellena los ___ de un stem con las respuestas, en orden. */
function fillBlanks(stem: string, answers: string[]): string {
  let i = 0;
  return stem.split(BLANK).reduce((acc, part, idx) => (idx === 0 ? part : acc + (answers[i++] ?? BLANK) + part));
}

/** Dos voces contrastantes para los diálogos anónimos A:/B: de los ejercicios. */
const DIALOGUE_VOICES: Record<string, { kokoro: string; lang: string }> = {
  A: { kokoro: 'af_bella', lang: 'en-US' },
  B: { kokoro: 'am_michael', lang: 'en-US' },
};

/**
 * Parte "A: ...  B: ..." en turnos, o null si no hay marcadores.
 *
 * Las etiquetas "A:"/"B:" NO van al audio: son señales de turno, no habla. Sin
 * esto el TTS leía literalmente "A" y "B", que sonaba raro.
 */
function parseTurns(text: string): { label: string; text: string }[] | null {
  if (!/\b[A-Z]:\s/.test(text)) return null;
  const parts = text.split(/\b([A-Z]):\s*/).filter((s, i) => i > 0 || s.trim());
  const turns: { label: string; text: string }[] = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    const label = parts[i]!.trim();
    const body = parts[i + 1]!.trim();
    if (label && body) turns.push({ label, text: body });
  }
  return turns.length >= 2 ? turns : null;
}

/** Emite un audio de diálogo A:/B: con una voz por hablante (solo Kokoro). */
function pushDialogue(key: string, turns: { label: string; text: string }[]): void {
  if (PROVIDER_ID === 'azure') {
    // Azure multi-voz se maneja con segments igual; abajo se arma el SSML.
  }
  const known = Object.keys(DIALOGUE_VOICES);
  const segments = turns.map((t) => {
    const v = DIALOGUE_VOICES[t.label] ?? DIALOGUE_VOICES[known[0]!]!;
    return { text: t.text, voice: v.kokoro, lang: v.lang };
  });
  utterances.push({
    key,
    text: turns.map((t) => t.text).join(' '), // referencia para el hash y el fallback
    voice: segments[0]!.voice,
    rate: 0.95,
    lang: 'en-US',
    segments,
  });
}

for (const atom of atoms) {
  switch (atom.kind) {
    case 'phrase': {
      push(atom.id, atom.text, atom.speaker);
      if (atom.slowVariant) push(`${atom.id}.slow`, atom.text, atom.speaker, SLOW_RATE_FACTOR);
      // Las alternativas son la misma persona reformulando → misma voz.
      atom.alternatives?.forEach((t, i) => push(`${atom.id}.alt.${i}`, t, atom.speaker));
      // atom.replies no se sintetiza acá: o son turnos reales de un diálogo, o
      // están duplicadas en un átomo qa, que sí sabe con qué voz se responden.
      break;
    }
    case 'qa': {
      push(atom.id, atom.prompt, atom.speaker);
      atom.promptVariants.forEach((t, i) => push(`${atom.id}.alt.${i}`, t, atom.speaker));
      atom.replies.forEach((t, i) => push(`${atom.id}.reply.${i}`, t, atom.replySpeaker));
      break;
    }
    case 'lexeme': {
      // La palabra suelta, con la voz de su oración de ejemplo: la misma boca.
      const ex = byId.get(atom.examplePhraseId);
      const sp = ex?.kind === 'phrase' ? ex.speaker : NEUTRAL_SPEAKER;
      push(atom.id, atom.word, sp);
      break;
    }
    case 'contrast': {
      // Los pares sueltos entrenan el fonema; las oraciones, el contexto.
      atom.pair.forEach((w, i) => push(`${atom.id}.pair.${i}`, w, NEUTRAL_SPEAKER));
      atom.examples.forEach((ex, i) =>
        push(`${atom.id}.ex.${i}`, fillBlanks(ex.text, [atom.pair[ex.correct]!]), NEUTRAL_SPEAKER)
      );
      break;
    }
    case 'exercise': {
      // Un ejercicio de puntuación no tiene versión auditiva: las mayúsculas y
      // los apóstrofes no suenan. Ver ARQUITECTURA.md §6.3.
      if (atom.audioViable === 'text-only') break;
      atom.items.forEach((item, i) => {
        const speaker = item.speaker ?? NEUTRAL_SPEAKER;
        const text =
          atom.format === 'cloze'
            ? fillBlanks(item.stem, (item.blanks ?? []).map((b) => b.accept[0]!))
            : item.answer?.accept[0];
        if (!text) return;
        // Si el ítem es un diálogo A:/B:, dos voces sin leer las etiquetas.
        const turns = parseTurns(text);
        if (turns) pushDialogue(`${atom.id}.item.${i}`, turns);
        else push(`${atom.id}.item.${i}`, text, speaker);
      });
      break;
    }
    case 'listening': {
      push(atom.id, atom.narrative, atom.speaker);
      atom.questions.forEach((q, i) => push(`${atom.id}.q.${i}`, q.q, NEUTRAL_SPEAKER));
      break;
    }
    case 'production': {
      push(atom.id, atom.prompt, atom.speaker);
      push(`${atom.id}.model`, atom.modelAnswer, atom.speaker);
      push(`${atom.id}.model.slow`, atom.modelAnswer, atom.speaker, SLOW_RATE_FACTOR);
      break;
    }
    case 'dialogue':
      // Un diálogo es una secuencia de phrases: su audio ya existe. No se duplica.
      break;
  }
}

// Segunda pasada: por cada emisión que califica, sus voces alternativas.
// Se hace acá, sobre la lista ya armada, en vez de esparcir flags por cada push.
for (const u of [...utterances]) {
  if (!wantsAlts(u)) continue;
  for (const alt of ALT_VOICES) {
    if (alt.id === u.voice) continue;
    utterances.push({
      key: `${u.key}.v.${alt.id}`,
      text: u.text,
      voice: alt.id,
      rate: u.rate,
      lang: alt.id.startsWith('b') ? 'en-GB' : 'en-US',
    });
  }
}

const selected = ONLY ? utterances.filter((u) => u.key.startsWith(ONLY)) : utterances;

/* ─────────────────────────────────── manifest ───────────────────────────────────── */

const manifestEntrySchema = z.object({
  src: z.string(),
  durationMs: z.number(),
  hash: z.string(),
  chars: z.number(),
});
const manifestSchema = z.object({
  generatedAt: z.string(),
  provider: z.string(),
  entries: z.record(z.string(), manifestEntrySchema),
});
type Manifest = z.infer<typeof manifestSchema>;

const manifest: Manifest = existsSync(MANIFEST_PATH)
  ? manifestSchema.parse(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')))
  : { generatedAt: '', provider: '', entries: {} };

/**
 * El hash cubre todo lo que cambia el audio. Si algo cambia, se re-sintetiza.
 *
 * Incluye la versión del pipeline SOLO para textos multi-oración: el split por
 * oraciones cambió cómo suenan (pausas reales, y sin el truncado a ~27s de
 * Kokoro con textos largos). Los de una sola oración salen idénticos, así que su
 * hash no cambia y no se regeneran de gusto.
 */
const MULTI_SENTENCE_PIPELINE = 'v2-split';
const hashOf = (u: Utterance): string => {
  // Los segmentos (diálogo A:/B: con dos voces) definen el audio: van al hash.
  const segTag = u.segments ? '|seg:' + u.segments.map((s) => `${s.voice}:${s.text}`).join('|') : '';
  const tag = !u.segments && splitSentences(u.text).length > 1 ? `|${MULTI_SENTENCE_PIPELINE}` : '';
  return createHash('sha256')
    .update(`${u.text}|${u.voice}|${u.rate}|${u.lang}${tag}${segTag}`)
    .digest('hex')
    .slice(0, 16);
};

const srcOf = (key: string): string => `/audio/${key.split('.').slice(0, 2).join('/')}/${key}.mp3`;

const stale = selected.filter((u) => {
  if (FORCE) return true;
  const prev = manifest.entries[u.key];
  if (!prev || prev.hash !== hashOf(u)) return true;
  return !existsSync(join(ROOT, 'public', prev.src));
});

/* ──────────────────────────────────── reporte ───────────────────────────────────── */

const chars = (list: Utterance[]) => list.reduce((n, u) => n + u.text.length, 0);
const FREE_TIER_CHARS = 500_000;

console.log(`\nproveedor: ${PROVIDER_ID}${PROVIDER_ID === 'kokoro' ? ' (local, libre, sin credenciales)' : ''}`);
console.log(`átomos: ${atoms.length}  ·  emisiones: ${utterances.length}${ONLY ? ` (filtradas: ${selected.length})` : ''}`);
console.log(`caracteres totales: ${chars(selected).toLocaleString('es')}`);
if (PROVIDER_ID === 'azure') {
  console.log(`  = ${((chars(selected) / FREE_TIER_CHARS) * 100).toFixed(1)}% de la capa gratuita mensual de Azure (500.000)`);
}
console.log(`a sintetizar ahora: ${stale.length}  (${chars(stale).toLocaleString('es')} chars)`);
console.log(`ya en cache: ${selected.length - stale.length}`);

if (missingVoice.length) {
  console.log(`\nSIN VOZ (${missingVoice.length}):`);
  for (const m of missingVoice.slice(0, 10)) console.log(`  ${m}`);
}

if (DRY_RUN) {
  console.log('\n--dry-run: no se sintetizó nada.\n');
  process.exit(0);
}
if (!stale.length) {
  console.log('\n✓ todo el audio está al día.\n');
  process.exit(0);
}

/* ──────────────────────────────────── síntesis ──────────────────────────────────── */

function buildProvider(): TtsProvider {
  if (PROVIDER_ID === 'kokoro') return createKokoroProvider();

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    console.error(
      '\n✗ --provider=azure necesita AZURE_SPEECH_KEY y AZURE_SPEECH_REGION.\n' +
        '  Copiá .env.example a .env y completalo.\n' +
        '  O usá el proveedor por defecto (kokoro), que no necesita credenciales.\n'
    );
    process.exit(1);
  }
  return createAzureProvider(key, region);
}

const provider = buildProvider();
if (provider.init) {
  console.log(`\ncargando ${provider.name}… (la primera vez descarga el modelo, ~90 MB)`);
  await provider.init();
}
console.log(`\nsintetizando con ${provider.name}\n`);

const t0 = Date.now();
let done = 0;
for (const u of stale) {
  const { data, durationMs } = await provider.synth(u);
  const src = srcOf(u.key);
  const out = join(ROOT, 'public', src);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, data);
  manifest.entries[u.key] = { src, durationMs, hash: hashOf(u), chars: u.text.length };
  done++;
  if (done % 10 === 0 || done === stale.length) {
    const rate = (Date.now() - t0) / done;
    const etaMin = ((stale.length - done) * rate) / 60000;
    console.log(`  ${done}/${stale.length}${etaMin > 0.2 ? `  (~${etaMin.toFixed(1)} min restantes)` : ''}`);
  }
}

manifest.generatedAt = new Date().toISOString();
manifest.provider = provider.name;
mkdirSync(AUDIO_DIR, { recursive: true });
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

console.log(`\n✓ ${done} audio(s) generados. Manifest: ${manifest.entries ? Object.keys(manifest.entries).length : 0} entradas.\n`);
