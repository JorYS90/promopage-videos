const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./config');

// Store simples de jobs em memória + persistência em data/jobs.json
// (sobrevive a restart; histórico leve). Estados:
// queued -> processing -> done | error
const ARQ = path.join(DATA_DIR, 'jobs.json');
const jobs = new Map();

function carregar() {
  try {
    const raw = JSON.parse(fs.readFileSync(ARQ, 'utf-8'));
    for (const j of raw) jobs.set(j.id, j);
  } catch {
    /* primeiro boot, sem arquivo */
  }
}
carregar();

let salvarPendente = null;
function salvar() {
  // debounce — escrita não-bloqueante
  if (salvarPendente) clearTimeout(salvarPendente);
  salvarPendente = setTimeout(() => {
    fs.writeFile(ARQ, JSON.stringify([...jobs.values()], null, 2), () => {});
  }, 200);
}

function criar(id, props) {
  const job = {
    id,
    status: 'queued',
    progress: 0,
    props,
    outputUrl: null,
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(id, job);
  salvar();
  return job;
}

function atualizar(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, patch, { updatedAt: Date.now() });
  salvar();
  return job;
}

function obter(id) {
  return jobs.get(id) || null;
}

function listar() {
  return [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

// Versão "pública" do job (sem expor props internos pesados, mas mantém o essencial).
function publico(job) {
  if (!job) return null;
  const { id, status, progress, outputUrl, error, createdAt, updatedAt } = job;
  return {
    id,
    status,
    progress,
    outputUrl,
    error,
    createdAt,
    updatedAt,
    formato: job.props?.formato,
    segmento: job.props?.segmento,
    empresa: job.props?.empresa?.nome,
    qtdProdutos: job.props?.produtos?.length,
  };
}

module.exports = { criar, atualizar, obter, listar, publico };
