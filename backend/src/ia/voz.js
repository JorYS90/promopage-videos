// IA de voz — narração de abertura/CTA/encerramento. Provedores:
//   - 'elevenlabs' : qualidade alta (exige ELEVENLABS_API_KEY + plano pago p/ vozes da lib)
//   - 'google'     : TTS gratuito do Google Tradutor (voz simples, sem chave) — bom p/ teste
//   - 'auto'       : tenta ElevenLabs e cai no Google se falhar
// Configurável via TTS_PROVIDER no .env. Sem nada disponível, não gera narração.
const fs = require('fs');
const path = require('path');
const {
  ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID,
  ELEVENLABS_MODEL,
  TTS_PROVIDER,
  OUT_DIR,
  PUBLIC_BASE_URL,
} = require('../config');

// Ajustes de voz pensados pra locutor de comercial: dicção firme + boa
// expressividade, sem ficar instável. style dá energia de propaganda.
const VOICE_SETTINGS = { stability: 0.45, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true };

async function ttsEleven(texto, destino, voiceId) {
  if (!ELEVENLABS_API_KEY) throw new Error('sem ELEVENLABS_API_KEY');
  const vid = voiceId || ELEVENLABS_VOICE_ID;
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: texto, model_id: ELEVENLABS_MODEL, voice_settings: VOICE_SETTINGS }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`ElevenLabs ${resp.status} ${txt.slice(0, 120)}`);
  }
  fs.writeFileSync(destino, Buffer.from(await resp.arrayBuffer()));
}

// Google Tradutor TTS (não-oficial, grátis). Limite ~200 chars por requisição.
async function ttsGoogle(texto, destino) {
  const q = String(texto).slice(0, 200);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${encodeURIComponent(q)}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', Referer: 'https://translate.google.com/' },
  });
  if (!resp.ok) throw new Error(`Google TTS ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  if (buf.length < 500) throw new Error('Google TTS retornou vazio');
  fs.writeFileSync(destino, buf);
}

async function tts(texto, destino, voiceId) {
  if (TTS_PROVIDER === 'google') { await ttsGoogle(texto, destino); return 64000; }
  if (TTS_PROVIDER === 'auto') {
    try { await ttsEleven(texto, destino, voiceId); return 128000; }
    catch (e) { console.warn('[ia/voz] ElevenLabs falhou, usando Google:', e.message); await ttsGoogle(texto, destino); return 64000; }
  }
  await ttsEleven(texto, destino, voiceId); return 128000; // 'elevenlabs' (default)
}

// Duração (segundos) do mp3 CBR pelo tamanho/bitrate. Google=64k, ElevenLabs=128k.
function duracaoMp3(arq, bitrate) {
  try { return (fs.statSync(arq).size * 8) / bitrate; } catch { return 3; }
}

// True se a narração pode ser gerada com a config atual.
function vozAtiva() {
  if (TTS_PROVIDER === 'google' || TTS_PROVIDER === 'auto') return true;
  return !!ELEVENLABS_API_KEY;
}

// Converte "19,90" -> "19 reais e 90" pra leitura natural do TTS.
function precoFalado(preco) {
  const limpo = String(preco || '').replace(/[^0-9,.]/g, '').replace('.', ',');
  const [r, c] = limpo.split(',');
  const reais = parseInt(r || '0', 10) || 0;
  const cent = c ? parseInt(c.padEnd(2, '0').slice(0, 2), 10) : 0;
  let s = `${reais} ${reais === 1 ? 'real' : 'reais'}`;
  if (cent > 0) s += ` e ${cent}`;
  return s;
}

// Texto narrado de um produto: "{nome}, por {preço falado}".
function textoProdutoNarracao(p) {
  return `${p.nome}${p.preco ? `, por ${precoFalado(p.preco)}` : ''}`;
}

// Gera narração de abertura + CTA + encerramento + cada produto.
// Retorna { audio, duracoesProduto } — duracoesProduto é a duração real medida de
// cada narração de produto (+ folga), pra a cena se ajustar e não atropelar a fala.
async function gerarNarracao(jobId, props) {
  if (!vozAtiva()) return { audio: {} };
  const voiceId = props.vozId || undefined; // voz escolhida no painel (ou padrão do .env)
  const audio = {};
  // Duração (s) medida de cada narração de cena fixa, pra a cena esticar e não
  // cortar a fala. folga = respiro no fim antes da transição/fim do vídeo.
  const duracoesCena = {};
  const fazer = async (texto, sufixo, chave, chaveCena, folga = 0.6) => {
    if (!texto) return;
    try {
      const arq = path.join(OUT_DIR, `${jobId}-${sufixo}.mp3`);
      const bitrate = await tts(texto, arq, voiceId);
      audio[chave] = `${PUBLIC_BASE_URL}/out/${jobId}-${sufixo}.mp3`;
      if (chaveCena) duracoesCena[chaveCena] = Math.round((duracaoMp3(arq, bitrate) + folga) * 10) / 10;
    } catch (err) {
      console.warn(`[ia/voz] ${sufixo} falhou:`, err.message);
    }
  };
  await fazer(props.introTexto, 'intro', 'narracaoIntro', 'intro', 0.6);

  // Narração por produto: "{nome} por {preço falado}". Mede a duração real do mp3
  // pra a cena se ajustar (mínimo 3s, +0,5s de folga no fim).
  let duracoesProduto;
  if (Array.isArray(props.produtos)) {
    const urls = [];
    const dur = [];
    for (let i = 0; i < props.produtos.length; i++) {
      const p = props.produtos[i];
      const arq = path.join(OUT_DIR, `${jobId}-prod-${i}.mp3`);
      try {
        const bitrate = await tts(textoProdutoNarracao(p), arq, voiceId);
        urls[i] = `${PUBLIC_BASE_URL}/out/${jobId}-prod-${i}.mp3`;
        dur[i] = Math.round(Math.max(3, duracaoMp3(arq, bitrate) + 0.5) * 10) / 10;
      } catch (err) {
        console.warn(`[ia/voz] produto ${i} falhou:`, err.message);
        urls[i] = null;
        dur[i] = 3;
      }
    }
    audio.narracaoProdutos = urls;
    duracoesProduto = dur;
  }

  await fazer(props.cta, 'cta', 'narracaoCta', 'cta', 0.6);
  // Encerramento precisa de folga maior: é a última cena, sem cena depois pra
  // "segurar" a cauda da voz (e ainda tem o fade-out da trilha no fim).
  await fazer(props.finalTexto, 'final', 'narracaoFinal', 'final', 1.0);
  return { audio, duracoesProduto, duracoesCena };
}

module.exports = { gerarNarracao, vozAtiva };
