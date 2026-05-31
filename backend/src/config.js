const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(ROOT, '..');

const PORT = parseInt(process.env.PORT || '4020', 10);

const config = {
  PORT,
  // URL pública usada nos inputProps (o headless chrome do render busca as
  // imagens/áudios por aqui). Em prod, apontar pro domínio real.
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`,
  RENDER_CONCURRENCY: parseInt(process.env.RENDER_CONCURRENCY || '1', 10),
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',

  // Pastas
  UPLOADS_DIR: path.join(ROOT, 'uploads'),
  UPLOADS_PRODUTOS: path.join(ROOT, 'uploads', 'produtos'),
  UPLOADS_LOGOS: path.join(ROOT, 'uploads', 'logos'),
  UPLOADS_TEMAS: path.join(ROOT, 'uploads', 'temas'),
  UPLOADS_MUSICAS: path.join(ROOT, 'uploads', 'musicas'),
  OUT_DIR: path.join(ROOT, 'out'),
  DATA_DIR: path.join(ROOT, 'data'),
  // Biblioteca de trilhas curada (o admin coloca mp3s royalty-free aqui).
  MUSICAS_DIR: path.join(ROOT, 'musicas'),

  // Entry point do projeto Remotion (irmão do backend)
  REMOTION_ENTRY: path.join(PROJECT_ROOT, 'remotion', 'src', 'index.ts'),
  COMPOSITION_ID: 'Promo',

  // IA opcional
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  // Rômulo Franklin — locutor de rádio BR (Voice Library do ElevenLabs).
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || 'HR2TRGmi4QbMsO5omv7l',
  ELEVENLABS_MODEL: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  // 'elevenlabs' (default) | 'google' (grátis) | 'auto' (tenta eleven, cai no google)
  TTS_PROVIDER: process.env.TTS_PROVIDER || 'elevenlabs',

  // === Auth compartilhada com o PromoPage ===
  // URL base do backend do PromoPage. O PromoVideo chama /api/auth/me lá pra
  // descobrir quem é o user a partir do cookie de sessão.
  PROMOPAGE_AUTH_URL: process.env.PROMOPAGE_AUTH_URL || 'http://localhost:4010',
  // Bypass de dev: quando "1", todas as requisições passam como admin local
  // (útil quando o PromoPage não está rodando ou pra testar admin sem login).
  DEV_ALLOW_ADMIN: (process.env.DEV_ALLOW_ADMIN || '') === '1',
  // Dev-only: confia nos headers X-Pp-User-* enviados pelo frontend (vindos do
  // localStorage do useAuth). NUNCA ative em PROD — qualquer um pode se passar
  // por qualquer user via header. Em prod, use só o cookie .promopage.com.br.
  DEV_TRUST_PP_HEADERS: (process.env.DEV_TRUST_PP_HEADERS || '') === '1',
};

for (const dir of [
  config.UPLOADS_DIR,
  config.UPLOADS_PRODUTOS,
  config.UPLOADS_LOGOS,
  config.UPLOADS_TEMAS,
  config.UPLOADS_MUSICAS,
  config.MUSICAS_DIR,
  config.OUT_DIR,
  config.DATA_DIR,
]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

module.exports = config;
