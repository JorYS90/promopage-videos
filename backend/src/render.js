const path = require('path');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderMedia, ensureBrowser } = require('@remotion/renderer');
const { REMOTION_ENTRY, COMPOSITION_ID, OUT_DIR } = require('./config');

// Bundle do projeto Remotion — feito UMA vez e reutilizado (caro).
let bundlePromise = null;
function getServeUrl() {
  if (!bundlePromise) {
    console.log('[render] criando bundle do Remotion (primeira vez)...');
    bundlePromise = bundle({
      entryPoint: REMOTION_ENTRY,
      // webpackOverride padrão já lida com TS/React do projeto remotion/.
    }).catch((err) => {
      // Não cacheia bundle que falhou — senão todo render seguinte herda o erro.
      bundlePromise = null;
      throw err;
    });
  }
  return bundlePromise;
}

// Renderiza o job em mp4. onProgress(0..1) pra atualizar o status.
async function renderJob(job, onProgress) {
  const serveUrl = await getServeUrl();
  const inputProps = job.props;

  // Resolve dimensões/duração via calculateMetadata da composition.
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });

  const outputLocation = path.join(OUT_DIR, `${job.id}.mp4`);

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation,
    inputProps,
    onProgress: ({ progress }) => onProgress && onProgress(progress),
  });

  return `/out/${job.id}.mp4`;
}

// Pré-aquece no boot: baixa/abre o Chromium e cria o bundle, pra o 1º render do
// usuário não pagar esse custo. Fire-and-forget (não derruba o boot se falhar).
function prewarm() {
  ensureBrowser().catch((e) => console.warn('[render] ensureBrowser:', e.message));
  getServeUrl()
    .then(() => console.log('[render] bundle pronto (pré-aquecido)'))
    .catch((e) => console.warn('[render] prewarm bundle falhou:', e.message));
}

module.exports = { renderJob, getServeUrl, prewarm };
