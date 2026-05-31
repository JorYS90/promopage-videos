// Orquestrador de busca de imagem — réplica enxuta do pipeline do PromoPage.
// Ordem: cache → Bing → Open Food Facts → DuckDuckGo → Wikimedia → Google CSE → placeholder.
// A imagem escolhida é baixada pro /uploads local (render e remoção de fundo precisam
// de URL acessível, sem CORS). O cache persistente é a "base de dados" que cresce com o
// uso — futuramente compartilhável com o PromoPage.
const fs = require('fs');
const path = require('path');
const {
  buscarBingImages, buscarOpenFoodFacts, buscarDuckDuckGo, buscarWikimedia,
  buscarGoogleCSE, primeiraUrlValida, downloadImagem, gerarPlaceholderUrl,
} = require('./busca-imagens');
const moderacao = require('./lib/moderacao');
const { DATA_DIR } = require('./config');

const CACHE_FILE = path.join(DATA_DIR, 'cache-imagens.json');
const TTL_OK = 30 * 24 * 60 * 60 * 1000;   // 30 dias p/ imagem real
const TTL_PLACEHOLDER = 24 * 60 * 60 * 1000; // 1 dia p/ placeholder

let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { cache = {}; }
let salvarPendente = null;
function salvarCache() {
  if (salvarPendente) clearTimeout(salvarPendente);
  salvarPendente = setTimeout(() => fs.writeFile(CACHE_FILE, JSON.stringify(cache), () => {}), 300);
}
function chave(nome) {
  return (nome || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
function cacheGet(nome) {
  const e = cache[chave(nome)];
  if (!e) return null;
  const ttl = e.fonte === 'placeholder' ? TTL_PLACEHOLDER : TTL_OK;
  if (Date.now() - e.t > ttl) { delete cache[chave(nome)]; return null; }
  return { imagem: e.imagem, fonte: `cache:${e.fonte}` };
}
function cacheSet(nome, imagem, fonte) {
  cache[chave(nome)] = { imagem, fonte, t: Date.now() };
  salvarCache();
}

const STOPWORDS = new Set(['de', 'do', 'da', 'com', 'sem', 'para', 'por', 'e', 'o', 'a', 'os', 'as', 'kg', 'g', 'ml', 'l', 'un', 'pct', 'cx', 'lt']);
function termos(nome) {
  return (nome || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/\s+/).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}
// O título do resultado precisa conter ao menos um termo relevante do produto.
function externoRelevante(nome, r) {
  const titulo = (r?.nome || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!titulo) return true; // alguns provedores não trazem título — não descarta
  const ts = termos(nome);
  if (ts.length === 0) return true;
  return ts.some((t) => titulo.includes(t));
}

// Busca a melhor imagem pra um nome de produto. Retorna { imagem (relativa ou externa), fonte }.
async function buscarMelhorImagem(nome) {
  const mod = moderacao.classificar(nome);
  if (mod.proibida) return { imagem: gerarPlaceholderUrl(nome, 'vermelho'), fonte: 'bloqueado' };

  const hit = cacheGet(nome);
  if (hit) return hit;

  const queryWeb = `${nome} produto supermercado`;
  let imagem = '';
  let fonte = null;

  const tentar = async (fn, marca) => {
    if (imagem) return;
    try {
      const res = await fn();
      if (res) { imagem = res; fonte = marca; }
    } catch { /* segue */ }
  };

  await tentar(async () => {
    const rel = (await buscarBingImages(queryWeb, 12)).filter((r) => externoRelevante(nome, r));
    const v = await primeiraUrlValida(rel, 5);
    return v?.imagem;
  }, 'bing');

  await tentar(async () => {
    const off = (await buscarOpenFoodFacts(nome, 6)).filter((r) => externoRelevante(nome, r));
    return off[0]?.imagem;
  }, 'openfoodfacts');

  await tentar(async () => {
    const dd = (await buscarDuckDuckGo(queryWeb, 6)).filter((r) => externoRelevante(nome, r));
    const v = await primeiraUrlValida(dd, 5);
    return v?.imagem;
  }, 'duckduckgo');

  await tentar(async () => {
    const wm = await buscarWikimedia(nome, 3);
    return wm[0]?.imagem;
  }, 'wikimedia');

  await tentar(async () => {
    const cse = (await buscarGoogleCSE(queryWeb, 5)).filter((r) => externoRelevante(nome, r));
    const v = await primeiraUrlValida(cse, 5);
    return v?.imagem;
  }, 'gcse');

  if (!imagem) {
    const ph = gerarPlaceholderUrl(nome, 'vermelho');
    cacheSet(nome, ph, 'placeholder');
    return { imagem: ph, fonte: 'placeholder' };
  }

  // Baixa pro /uploads local (evita CORS no render e na remoção de fundo).
  let local = imagem;
  try { local = await downloadImagem(imagem); } catch { /* mantém URL externa */ }
  cacheSet(nome, local, fonte);
  return { imagem: local, fonte };
}

module.exports = { buscarMelhorImagem, baixarLocal: downloadImagem };
