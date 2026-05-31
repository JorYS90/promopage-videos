// Favoritos de temas POR USUÁRIO. user vem do middleware lerAuth (cookie do
// PromoPage). Armazenado em data/favoritos.json: { [userId]: ["temaId", ...] }.
//
// Quando o backend do PromoPage tiver uma tabela de favoritos centralizada,
// podemos trocar este store por chamadas HTTP ao /api/favoritos do PromoPage.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./config');

const ARQ = path.join(DATA_DIR, 'favoritos.json');

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
function adicionar(userId, temaId) {
  if (!userId || !temaId) return false;
  const all = carregar();
  const set = new Set(all[userId] || []);
  set.add(temaId);
  all[userId] = [...set];
  salvar(all);
  return true;
}
function remover(userId, temaId) {
  if (!userId || !temaId) return false;
  const all = carregar();
  const lista = (all[userId] || []).filter((id) => id !== temaId);
  if (lista.length) all[userId] = lista;
  else delete all[userId];
  salvar(all);
  return true;
}

module.exports = { listar, adicionar, remover };
