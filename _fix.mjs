import { KokoroTTS } from 'kokoro-js';
import { splitSentences } from './scripts/tts/sentences.ts';
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype:'q8', device:'cpu' });
const u = JSON.parse((await import('node:fs')).readFileSync('content/en1/unit-1.json','utf8'));
const text = u.atoms.find(a=>a.kind==='listening').narrative;

// de una sola vez (lo que truncaba):
const whole = await tts.generate(text, { voice:'af_sarah', speed:0.85 });
console.log('  de una sola vez:', (whole.audio.length/whole.sampling_rate).toFixed(1)+'s  ← se cortaba acá');

// por oraciones (lo nuevo):
const sents = splitSentences(text);
let total=0;
for(const s of sents){ const a=await tts.generate(s,{voice:'af_sarah',speed:0.85}); total+=a.audio.length; }
console.log('  por oraciones:  ', (total/whole.sampling_rate).toFixed(1)+'s  en', sents.length, 'trozos (ninguno se trunca)');
