// Projetos de vídeo POR USUÁRIO. Cada projeto guarda os INPUTS do user (produtos,
// textos, regras, formato, tema escolhido, empresa) pra ele poder REABRIR e
// EDITAR sem digitar tudo de novo. user vem do middleware lerAuth (cookie do
// PromoPage). Armazenado em data/projetos.json: { [userId]: [proj1, proj2, ...] }.
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const { DATA_DIR } = require('./config');

const ARQ = path.join(DATA_DIR, 'projetos.json');

function carregar() {
  try { return JSON.parse(fs.readFileSync(ARQ, 'utf8')); }
  catch { return {}; }
}
function salvar(obj) {
  fs.writeFile(ARQ, JSON.stringify(obj, null, 2), () => {});
}

function listar(userId) {
  if (!userId) return [];
  const all = carregar();
  return all[userId] || [];
}
function obter(userId, id) {
  return listar(userId).find((p) => p.id === id) || null;
}
function criar(userId, dados) {
  if (!userId) return null;
  const all = carregar();
  const agora = new Date().toISOString();
  const proj = {
    id: 'proj-' + nanoid(8),
    nome: (dados.nome || '').trim() || 'Projeto sem nome',
    criadoEm: agora,
    atualizadoEm: agora,
    payload: dados.payload || {},
  };
  all[userId] = [proj, ...(all[userId] || [])];
  salvar(all);
  return proj;
}
function atualizar(userId, id, dados) {
  const all = carregar();
  const lista = all[userId] || [];
  const i = lista.findIndex((p) => p.id === id);
  if (i === -1) return null;
  lista[i] = {
    ...lista[i],
    nome: dados.nome != null ? String(dados.nome).trim() || lista[i].nome : lista[i].nome,
    payload: dados.payload != null ? dados.payload : lista[i].payload,
    atualizadoEm: new Date().toISOString(),
  };
  all[userId] = lista;
  salvar(all);
  return lista[i];
}
function remover(userId, id) {
  const all = carregar();
  const lista = (all[userId] || []).filter((p) => p.id !== id);
  if (lista.length) all[userId] = lista;
  else delete all[userId];
  salvar(all);
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover };
