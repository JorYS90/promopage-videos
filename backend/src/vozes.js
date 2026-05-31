// Vozes de locutor BR curadas da Voice Library do ElevenLabs. Usadas direto na
// síntese pelo voice_id (não precisa "adicionar" à conta). O painel mostra a
// prévia (preview_url) buscada ao vivo pra o usuário ouvir e escolher.
const { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } = require('./config');

const VOZES_BR = [
  { voice_id: 'HR2TRGmi4QbMsO5omv7l', nome: 'Rômulo — Locutor de rádio', perfil: 'Propaganda · locução clássica' },
  { voice_id: 'osNEKWSDSIVQD3Same62', nome: 'Taiguara', perfil: 'Propaganda · voz encorpada' },
  { voice_id: 'aTj4VBfbinmNWWCoROJZ', nome: 'Eliéser', perfil: 'Propaganda · sotaque do Sul' },
  { voice_id: 'Q0l58S3V13QxkdteObmh', nome: 'Thales', perfil: 'Propaganda · vibrante moderno' },
  { voice_id: 'U9M8vn5UNn2nhPX9vRPE', nome: 'Renato', perfil: 'Propaganda · melódico' },
  { voice_id: 'CnEjAO8AoeKlqOCv9Ink', nome: 'Miguel', perfil: 'Narração · grave cinematográfico' },
  { voice_id: 'Mn7FDiiQr3aIwMWsLE7r', nome: 'Guilherme', perfil: 'Narração · maduro' },
  { voice_id: 'z7lpKSQt5qSE9gT4lYbl', nome: 'Rogério', perfil: 'Narração · jovem enérgico' },
];

let cache = null;
async function listarVozes() {
  if (cache) return cache;
  const previews = {};
  if (ELEVENLABS_API_KEY) {
    try {
      const r = await fetch('https://api.elevenlabs.io/v1/shared-voices?language=pt&gender=male&page_size=100', {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      }).then((x) => x.json());
      (r.voices || []).forEach((v) => { if (v.preview_url) previews[v.voice_id] = v.preview_url; });
    } catch { /* segue sem prévia */ }
  }
  const vozes = VOZES_BR.map((v) => ({
    ...v,
    preview: previews[v.voice_id] || null,
    padrao: v.voice_id === ELEVENLABS_VOICE_ID,
  }));
  cache = { vozes, padrao: ELEVENLABS_VOICE_ID };
  return cache;
}

module.exports = { listarVozes };
