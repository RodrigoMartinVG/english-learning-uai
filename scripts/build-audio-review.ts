/**
 * build-audio-review.ts — una página para revisar las voces de a puñado.
 *
 * El problema de audios robóticos es POR VOZ, no por archivo: si una voz suena
 * mal, suenan mal sus ~30 audios, y se arregla cambiándola una sola vez. Así que
 * no hace falta escuchar los 246 — alcanza con 2-3 muestras de cada voz.
 *
 * Genera public/audio-review.html: agrupa por voz, reproduce muestras y arma la
 * lista de voces a cambiar con reemplazos sugeridos. Se abre con doble clic (los
 * audios se referencian por ruta relativa, no necesita servidor).
 *
 *   npm run audio:review   →   abrir public/audio-review.html
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { speakersFileSchema, unitFileSchema, type Atom, type Speaker } from '../content/schema.ts';
import { KOKORO_VOICES } from '../content/kokoro-voices.ts';

const ROOT = join(import.meta.dirname, '..');
const manifestPath = join(ROOT, 'public', 'audio', 'audio-manifest.json');
if (!existsSync(manifestPath)) {
  console.error('\n✗ No hay audio generado. Corré primero: npm run build:audio\n');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  entries: Record<string, { src: string }>;
};
const speakers = speakersFileSchema.parse(
  JSON.parse(readFileSync(join(ROOT, 'content', 'speakers.json'), 'utf8'))
).speakers;
const speakerById = new Map<string, Speaker>(speakers.map((s) => [s.id, s]));

// Reunir muestras (audioKey, texto) por speaker, desde el contenido.
const samples = new Map<string, { key: string; text: string }[]>();
const add = (sp: string, key: string, text: string) => {
  if (!(key in manifest.entries)) return; // solo lo que realmente se generó
  const g = samples.get(sp) ?? [];
  if (g.length < 4) g.push({ key, text }); // 4 muestras alcanzan para juzgar una voz
  samples.set(sp, g);
};

for (const c of ['en1']) {
  const file = join(ROOT, 'content', c, 'unit-1.json');
  if (!existsSync(file)) continue;
  const unit = unitFileSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  for (const a of unit.atoms as Atom[]) {
    if (a.kind === 'phrase') add(a.speaker, a.id, a.text);
    else if (a.kind === 'qa') {
      add(a.speaker, a.id, a.prompt);
      a.replies.forEach((r, i) => add(a.replySpeaker, `${a.id}.reply.${i}`, r));
    } else if (a.kind === 'listening') add(a.speaker, a.id, a.narrative.slice(0, 60) + '…');
    else if (a.kind === 'production') add(a.speaker, a.id, a.prompt.slice(0, 60) + '…');
  }
}

// Voces libres del mismo tipo (género+región), para sugerir reemplazo.
const inUse = new Set(speakers.map((s) => s.voice.kokoro));
const kind = (id: string) => KOKORO_VOICES.find((k) => k.id === id);
const freeLike = (id: string) => {
  const m = kind(id);
  return KOKORO_VOICES.filter((k) => !inUse.has(k.id) && k.gender === m?.gender && k.region === m?.region).map((k) => k.id);
};

// Datos para el HTML, solo speakers con audio en la U1.
const cards = [...samples.entries()]
  .map(([id, list]) => {
    const s = speakerById.get(id)!;
    return {
      id,
      name: s.displayName,
      voice: s.voice.kokoro,
      accent: s.accent,
      gender: s.gender,
      alts: freeLike(s.voice.kokoro),
      samples: list.map((x) => ({ src: manifest.entries[x.key]!.src.replace(/^\//, ''), text: x.text })),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const DATA = JSON.stringify(cards);

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisión de voces — Oda</title>
<style>
 :root{--bg:#0b0e14;--surface:#141924;--hi:#1e2532;--border:#2a3242;--text:#e6eaf2;--dim:#8b94a7;--faint:#5b6478;--accent:#5b8cff;--bad:#ff6b6b}
 *{box-sizing:border-box;margin:0;padding:0}
 body{background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;line-height:1.5;padding:24px;max-width:760px;margin:0 auto}
 h1{font-size:24px;letter-spacing:-.02em;margin-bottom:4px}
 .sub{color:var(--dim);font-size:14px;margin-bottom:24px}
 .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;transition:border-color .15s}
 .card.bad{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 8%,var(--surface))}
 .top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
 .who{font-weight:600;font-size:17px}
 .voice{font-family:ui-monospace,monospace;font-size:12px;color:var(--faint);background:var(--hi);padding:2px 8px;border-radius:6px;margin-left:8px}
 .samples{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
 .s{display:flex;gap:10px;align-items:center;font-size:14px}
 .play{min-width:40px;min-height:40px;border-radius:8px;background:var(--hi);border:1px solid var(--border);color:var(--text);cursor:pointer;font-size:15px}
 .play:hover{border-color:var(--accent)}
 .play.on{background:var(--accent);color:#08101f}
 .txt{color:var(--dim)}
 .mark{min-height:40px;padding:0 14px;border-radius:8px;border:1px solid var(--border);background:var(--hi);color:var(--dim);cursor:pointer;font:inherit;font-size:13px}
 .mark:hover{border-color:var(--bad);color:var(--bad)}
 .card.bad .mark{background:var(--bad);border-color:var(--bad);color:#1a0505}
 .alts{font-size:13px;color:var(--faint);margin-top:8px}
 .alts b{color:var(--dim);font-family:ui-monospace,monospace}
 #plan{position:sticky;bottom:0;background:var(--hi);border:1px solid var(--accent);border-radius:12px;padding:16px;margin-top:24px}
 #plan h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:10px}
 #plan pre{font-family:ui-monospace,monospace;font-size:12px;color:var(--text);white-space:pre-wrap;line-height:1.7}
 #plan .empty{color:var(--faint);font-size:13px}
</style></head><body>
<h1>Revisión de voces</h1>
<p class="sub">Probá 2-3 muestras de cada voz. Si una suena robótica, tocá <b>Suena mal</b>: abajo se arma el plan para cambiarla. Solo hace falta juzgar la voz, no cada audio.</p>
<div id="cards"></div>
<div id="plan"><h2>Voces a cambiar</h2><div id="planbody"><span class="empty">Ninguna marcada todavía.</span></div></div>
<script>
const DATA=${DATA};
const bad=new Set();
let playing=null;
function toggle(id){bad.has(id)?bad.delete(id):bad.add(id);render();}
function play(src,btn){
  if(playing){playing.pause();document.querySelectorAll('.play.on').forEach(b=>b.classList.remove('on'));}
  const a=new Audio(src);playing=a;btn.classList.add('on');
  a.onended=()=>btn.classList.remove('on');
  a.play().catch(()=>{btn.classList.remove('on');btn.textContent='✕';});
}
function render(){
  document.getElementById('cards').innerHTML=DATA.map(c=>\`
   <div class="card \${bad.has(c.id)?'bad':''}">
    <div class="top">
      <div><span class="who">\${c.name}</span><span class="voice">\${c.voice}</span><span class="voice">\${c.accent}</span></div>
      <button class="mark" onclick="toggle('\${c.id}')">\${bad.has(c.id)?'✓ Marcada':'Suena mal'}</button>
    </div>
    <div class="samples">\${c.samples.map(s=>\`<div class="s"><button class="play" onclick="play('\${s.src}',this)">▶</button><span class="txt">\${s.text.replace(/</g,'&lt;')}</span></div>\`).join('')}</div>
    \${bad.has(c.id)?\`<div class="alts">Reemplazos libres del mismo tipo: <b>\${c.alts.slice(0,5).join(', ')||'(no quedan)'}</b></div>\`:''}
   </div>\`).join('');
  const marked=DATA.filter(c=>bad.has(c.id));
  document.getElementById('planbody').innerHTML=marked.length
    ?'<pre>En content/speakers.json, cambiar voice.kokoro:\\n\\n'+marked.map(c=>\`  "\${c.id}": \${c.voice}  →  \${c.alts[0]||'(elegir otra)'}\`).join('\\n')+'\\n\\nDespués: npm run build:audio -- --force</pre>'
    :'<span class="empty">Ninguna marcada todavía.</span>';
}
render();
</script></body></html>`;

const out = join(ROOT, 'public', 'audio-review.html');
writeFileSync(out, html);
console.log(`\n✓ ${cards.length} voces · ${cards.reduce((n, c) => n + c.samples.length, 0)} muestras`);
console.log(`\nAbrí este archivo con doble clic:\n  ${out}\n`);
