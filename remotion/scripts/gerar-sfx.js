// Gera os SFX de impacto (sintetizados, sem questão de licença) em
// remotion/public/sfx/. Rode 1x: `node scripts/gerar-sfx.js`. Os WAVs ficam
// versionados como assets — só rode de novo se quiser regerar/ajustar.
const fs = require('fs');
const path = require('path');

const SR = 44100;
const DEST = path.join(__dirname, '..', 'public', 'sfx');
fs.mkdirSync(DEST, { recursive: true });

function writeWav(arquivo, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(DEST, arquivo), buf);
  return n;
}

// POP / "estampa" do preço — sweep agudo->grave + corpo + click curto.
function gerarPop() {
  const dur = 0.22;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 22);
    const f = 300 + 900 * Math.exp(-t * 45); // 1200 -> 300 Hz
    let s = Math.sin(2 * Math.PI * f * t);
    s += 0.5 * Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 16); // corpo
    if (t < 0.004) s += (Math.random() * 2 - 1) * 0.8 * (1 - t / 0.004); // click
    out[i] = s * env * 0.6;
  }
  return out;
}

// WHOOSH — ruído suavizado (lowpass simples) com envelope que sobe e desce.
function gerarWhoosh() {
  const dur = 0.5;
  const n = Math.floor(SR * dur);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = Math.random() * 2 - 1;
  const out = new Float32Array(n);
  const win = 6;
  for (let i = 0; i < n; i++) {
    let acc = 0;
    let c = 0;
    for (let k = -win; k <= win; k++) {
      const j = i + k;
      if (j >= 0 && j < n) {
        acc += raw[j];
        c++;
      }
    }
    const env = Math.sin(Math.PI * (i / n)); // 0..1..0
    out[i] = (acc / c) * env * 0.5;
  }
  return out;
}

const a = writeWav('pop.wav', gerarPop());
const b = writeWav('whoosh.wav', gerarWhoosh());
console.log(`OK  pop.wav (${a} amostras) · whoosh.wav (${b} amostras) em ${DEST}`);
