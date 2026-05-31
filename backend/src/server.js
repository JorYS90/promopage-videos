require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { nanoid } = require('nanoid');

const config = require('./config');
const { normalizar } = require('./schema');
const { TEMPLATES, FORMATOS, SEGMENTOS } = require('./templates');
const jobsStore = require('./jobs');
const temasDb = require('./temas-db');
const queue = require('./queue');
const { renderJob, prewarm } = require('./render');
const { enriquecerTextos } = require('./ia/texto');
const { gerarNarracao, vozAtiva } = require('./ia/voz');
const { listarVozes } = require('./vozes');
const { analisarBalaoInterior } = require('./balao');
const { lerAuth, requireAdmin } = require('./auth');
const favoritosDb = require('./favoritos-db');
const projetosDb = require('./projetos-db');

const app = express();

const corsOrigin = (process.env.CORS_ORIGIN || '').trim();
app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(',').map((s) => s.trim()) : true,
    credentials: true, // permite o frontend enviar cookies (auth do PromoPage)
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(lerAuth); // seta req.user a partir do cookie do PromoPage (ou null)

// Arquivos servidos (o headless chrome do render busca imagens/áudios aqui).
app.use('/uploads', express.static(config.UPLOADS_DIR));
app.use('/out', express.static(config.OUT_DIR));
app.use('/musicas', express.static(config.MUSICAS_DIR)); // biblioteca de trilhas

// === Upload de imagens (produto/logo) ===
function subdirUpload(tipo) {
  if (tipo === 'logo') return 'logos';
  if (tipo === 'fundo' || tipo === 'balao' || tipo === 'tema') return 'temas';
  if (tipo === 'musica') return 'musicas';
  return 'produtos';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = subdirUpload(req.query.tipo);
    const dir = sub === 'logos' ? config.UPLOADS_LOGOS
      : sub === 'temas' ? config.UPLOADS_TEMAS
      : sub === 'musicas' ? config.UPLOADS_MUSICAS
      : config.UPLOADS_PRODUTOS;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.png').toLowerCase();
    cb(null, `${nanoid()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // imagens sempre; áudio só pra trilha (tipo=musica)
    const ok = /^image\//.test(file.mimetype) || (req.query.tipo === 'musica' && /^audio\//.test(file.mimetype));
    cb(null, ok);
  },
});

// === Rotas ===
app.get('/api/health', (req, res) => {
  res.json({ ok: true, queue: queue.status() });
});

// Créditos das trilhas (atribuição CC BY) — backend/musicas/creditos.json.
function lerCreditos() {
  try {
    return JSON.parse(fs.readFileSync(path.join(config.MUSICAS_DIR, 'creditos.json'), 'utf8'));
  } catch {
    return {};
  }
}
// Monta o texto de crédito a partir do nome do arquivo (ou da URL da trilha).
function creditoTrilhaDe(trilhaUrl) {
  if (!trilhaUrl) return undefined;
  const arq = decodeURIComponent(String(trilhaUrl).split('/').pop() || '');
  const c = lerCreditos()[arq];
  if (!c || !c.autor) return undefined;
  return `Música: ${c.autor}${c.licenca ? ` (${c.licenca})` : ''}`;
}

// Biblioteca de trilhas (mp3/m4a/wav que o admin colocar em backend/musicas/).
app.get('/api/musicas', (req, res) => {
  let arquivos = [];
  try {
    arquivos = fs.readdirSync(config.MUSICAS_DIR).filter((f) => /\.(mp3|m4a|wav|ogg)$/i.test(f));
  } catch { /* pasta vazia */ }
  const creditos = lerCreditos();
  const trilhas = arquivos.map((f) => {
    const c = creditos[f];
    return {
      nome: f.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(),
      url: `${config.PUBLIC_BASE_URL}/musicas/${encodeURIComponent(f)}`,
      credito: c && c.autor ? `${c.autor}${c.licenca ? ` · ${c.licenca}` : ''}` : null,
    };
  });
  res.json({ trilhas });
});

// Vozes de locutor BR (com prévia) pra escolher no painel.
app.get('/api/vozes', async (req, res) => {
  try {
    res.json(await listarVozes());
  } catch (e) {
    res.json({ vozes: [], padrao: null });
  }
});

app.get('/api/templates', (req, res) => {
  res.json({
    templates: TEMPLATES,
    formatos: FORMATOS,
    segmentos: SEGMENTOS,
    limites: { minProdutos: 3, maxProdutos: 7 },
    ia: { texto: !!config.OPENAI_API_KEY, voz: vozAtiva() },
  });
});

app.post('/api/upload', upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'envie um arquivo de imagem no campo "imagem"' });
  const sub = subdirUpload(req.query.tipo);
  const url = `${config.PUBLIC_BASE_URL}/uploads/${sub}/${req.file.filename}`;
  // Balão de preço: detecta a área branca interna pra encaixar o preço dentro.
  let area;
  if (req.query.tipo === 'balao' && /\.png$/i.test(req.file.filename)) {
    area = analisarBalaoInterior(req.file.path) || undefined;
  }
  res.json({ url, area });
});

app.post('/api/videos', (req, res) => {
  let props;
  try {
    props = normalizar(req.body);
  } catch (err) {
    const msg = err?.errors?.map((e) => e.message).join('; ') || err.message;
    return res.status(400).json({ erro: msg });
  }

  // Quais textos o usuário forneceu manualmente (pra não sobrescrever com IA).
  const manual = {
    introTexto: !!(req.body.introTexto && req.body.introTexto.trim()),
    finalTexto: !!(req.body.finalTexto && req.body.finalTexto.trim()),
    cta: !!(req.body.cta && req.body.cta.trim()),
  };
  const usarIAtexto = req.body.usarIA !== false;
  // Narração e seleção de voz são EXCLUSIVAS DO ADMIN (gasta crédito ElevenLabs).
  // Não-admin pedindo voz → 403. Frontend já esconde o toggle, isso é o cinto+suspensório.
  const pediuVoz = req.body.narracao === true || (typeof req.body.vozId === 'string' && req.body.vozId.trim());
  if (pediuVoz && !req.user?.isAdmin) {
    return res.status(403).json({ erro: 'Narração com voz é exclusiva do admin (faça login no PromoPage).' });
  }
  const usarNarracao = req.body.narracao !== false;
  const trilha = typeof req.body.trilha === 'string' ? req.body.trilha : '';
  const sfx = req.body.sfx !== false; // efeitos sonoros de impacto (padrão ligado)
  const vozId = typeof req.body.vozId === 'string' ? req.body.vozId : '';

  const id = nanoid(10);
  const job = jobsStore.criar(id, props);
  // Marca o vídeo como sendo do user logado (pra histórico "Meus Vídeos" depois).
  if (req.user?.id) jobsStore.atualizar(id, { userId: req.user.id });

  // Processa na fila (não bloqueia a resposta).
  queue
    .enqueue(() => processar(job, { manual, usarIAtexto, usarNarracao, trilha, sfx, vozId }))
    .catch((err) => {
      console.error('[job] erro inesperado:', err);
      jobsStore.atualizar(id, { status: 'error', error: err.message });
    });

  res.status(202).json(jobsStore.publico(job));
});

app.get('/api/videos/:id', (req, res) => {
  const job = jobsStore.obter(req.params.id);
  if (!job) return res.status(404).json({ erro: 'job não encontrado' });
  res.json(jobsStore.publico(job));
});

app.get('/api/videos', (req, res) => {
  res.json(jobsStore.listar().map(jobsStore.publico));
});

// Busca de imagens / placeholder (auto-foto dos produtos)
app.use(require('./produtos-routes'));

// === Temas (built-in + custom) ===
app.get('/api/temas', (req, res) => {
  res.json({ temas: temasDb.listar() });
});
// Espelho do /api/auth/me do PromoPage — retorna o user (ou null) que o
// middleware lerAuth identificou pelo cookie. Útil pro frontend.
app.get('/api/me', (req, res) => {
  res.json({ user: req.user || null });
});

// === Temas favoritos (por usuário, autenticado via cookie do PromoPage) ===
function requireUser(req, res, next) {
  if (!req.user?.id) return res.status(401).json({ erro: 'logue no PromoPage pra usar favoritos' });
  next();
}
app.get('/api/temas-favoritos', requireUser, (req, res) => {
  res.json({ favoritos: favoritosDb.listar(req.user.id) });
});
app.post('/api/temas-favoritos', requireUser, (req, res) => {
  const temaId = req.body?.temaId;
  if (!temaId) return res.status(400).json({ erro: 'temaId obrigatório' });
  favoritosDb.adicionar(req.user.id, temaId);
  res.json({ ok: true });
});
app.delete('/api/temas-favoritos/:temaId', requireUser, (req, res) => {
  favoritosDb.remover(req.user.id, req.params.temaId);
  res.json({ ok: true });
});

// === Projetos por usuário (inputs salvos do vídeo) ===
app.get('/api/projetos', requireUser, (req, res) => {
  res.json({ projetos: projetosDb.listar(req.user.id) });
});
app.get('/api/projetos/:id', requireUser, (req, res) => {
  const p = projetosDb.obter(req.user.id, req.params.id);
  if (!p) return res.status(404).json({ erro: 'projeto não encontrado' });
  res.json({ projeto: p });
});
app.post('/api/projetos', requireUser, (req, res) => {
  const p = projetosDb.criar(req.user.id, req.body || {});
  res.json({ projeto: p });
});
app.put('/api/projetos/:id', requireUser, (req, res) => {
  const p = projetosDb.atualizar(req.user.id, req.params.id, req.body || {});
  if (!p) return res.status(404).json({ erro: 'projeto não encontrado' });
  res.json({ projeto: p });
});
app.delete('/api/projetos/:id', requireUser, (req, res) => {
  projetosDb.remover(req.user.id, req.params.id);
  res.json({ ok: true });
});

app.post('/api/temas', requireAdmin, (req, res) => {
  if (!req.body?.nome || !String(req.body.nome).trim()) {
    return res.status(400).json({ erro: 'nome do tema é obrigatório' });
  }
  res.status(201).json(temasDb.criar(req.body));
});
app.put('/api/temas/:id', requireAdmin, (req, res) => {
  const t = temasDb.atualizar(req.params.id, req.body || {});
  if (!t) return res.status(404).json({ erro: 'tema não encontrado ou não editável (built-in)' });
  res.json(t);
});
app.delete('/api/temas/:id', requireAdmin, (req, res) => {
  const ok = temasDb.remover(req.params.id);
  if (!ok) return res.status(404).json({ erro: 'tema não encontrado ou não editável (built-in)' });
  res.json({ ok: true });
});

// === Pipeline de processamento de um job ===
async function processar(job, { manual, usarIAtexto, usarNarracao, trilha, sfx, vozId }) {
  jobsStore.atualizar(job.id, { status: 'processing', progress: 0 });
  let props = job.props;
  if (vozId) props = { ...props, vozId }; // voz de locutor escolhida no painel

  // 1) IA de texto (opcional) — só preenche o que o usuário NÃO escreveu.
  if (usarIAtexto && config.OPENAI_API_KEY) {
    const ia = await enriquecerTextos(props);
    props = {
      ...props,
      introTexto: manual.introTexto ? props.introTexto : ia.introTexto,
      finalTexto: manual.finalTexto ? props.finalTexto : ia.finalTexto,
      cta: manual.cta ? props.cta : ia.cta,
    };
  }

  // 2) Áudio: narração (abertura/produtos/CTA/fim) + trilha de fundo.
  let audio = {};
  if (usarNarracao && vozAtiva()) {
    const r = await gerarNarracao(job.id, props);
    audio = r.audio || {};
    // Ajusta a duração das cenas pra caber a narração (duração real medida).
    if (r.duracoesProduto) props = { ...props, duracoesProduto: r.duracoesProduto };
    if (r.duracoesCena) props = { ...props, duracoesCena: r.duracoesCena };
  }
  if (trilha) audio.trilha = trilha; // música de fundo (upload do usuário)
  if (Object.keys(audio).length) props = { ...props, audio };

  // Crédito automático da trilha (atribuição CC BY) + flag de SFX.
  const credito = creditoTrilhaDe(trilha);
  if (credito) props = { ...props, creditoTrilha: credito };
  props = { ...props, sfx: sfx !== false };

  jobsStore.atualizar(job.id, { props });

  // 3) Render Remotion.
  const outputUrl = await renderJob(job, (p) =>
    jobsStore.atualizar(job.id, { progress: Math.round(p * 100) }),
  );

  jobsStore.atualizar(job.id, { status: 'done', progress: 100, outputUrl });
  console.log(`[job ${job.id}] pronto: ${outputUrl}`);
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: err.message || 'erro interno' });
});

app.listen(config.PORT, () => {
  console.log(`Promopage Videos API em http://localhost:${config.PORT}`);
  console.log(`  IA texto: ${config.OPENAI_API_KEY ? 'ON' : 'off'} · IA voz: ${vozAtiva() ? 'ON' : 'off'}`);
  prewarm(); // pré-aquece bundle + chromium pro 1º render ser rápido
});
