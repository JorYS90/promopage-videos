// Camada de acesso à API (proxy do Vite -> backend 4020).
//
// IMPORTANTE: alguns endpoints chamam o BACKEND DO PROMOPAGE (4010 em dev,
// promopage.com.br/api em prod) pra compartilhar dados e IA — sem duplicar
// código nem cache. Exemplo: busca de imagens (Bing/Google/OFF) é cara, então
// o cache fica centralizado no PromoPage e ambos os apps se beneficiam.
//
// Em prod: cookie do .promopage.com.br vai automático em ambos os subdomínios.
// Em dev: precisa cross-port (localhost:5175 → localhost:4010) com CORS aberto.
const API_PROMOPAGE = import.meta.env.PROD
  ? 'https://promopage.com.br'
  : 'http://localhost:4010';

export async function getTemplates() {
  const r = await fetch('/api/templates');
  if (!r.ok) throw new Error('falha ao carregar templates');
  return r.json();
}

export async function getTemas() {
  const r = await fetch('/api/temas');
  if (!r.ok) throw new Error('falha ao carregar temas');
  return r.json(); // { temas: [...] }
}

export async function getMusicas() {
  const r = await fetch('/api/musicas');
  if (!r.ok) throw new Error('falha ao carregar trilhas');
  return r.json(); // { trilhas: [{ nome, url }] }
}

export async function getVozes() {
  const r = await fetch('/api/vozes');
  if (!r.ok) throw new Error('falha ao carregar vozes');
  return r.json(); // { vozes: [{ voice_id, nome, perfil, preview, padrao }], padrao }
}

export async function criarTema(payload) {
  const r = await fetch('/api/temas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.erro || 'falha ao criar tema');
  return data;
}

export async function atualizarTema(id, payload) {
  const r = await fetch(`/api/temas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.erro || 'falha ao atualizar tema');
  return data;
}

export async function excluirTema(id) {
  const r = await fetch(`/api/temas/${id}`, { method: 'DELETE' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || 'falha ao excluir tema');
  return data;
}

export async function uploadImagem(file, tipo = 'produto') {
  const fd = new FormData();
  fd.append('imagem', file);
  const r = await fetch(`/api/upload?tipo=${tipo}`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('falha no upload');
  return r.json(); // { url }
}

// Busca a melhor imagem pra cada nome de produto. ANTES chamava o backend
// local (4020) que tinha cópia duplicada do busca-imagens.js do PromoPage.
// AGORA chama o backend do PromoPage diretamente — mesma implementação,
// MESMO cache (cache_busca_imagens table). Benefício: se um lojista busca
// "Coca-Cola 2L" no PromoPage, depois busca no PromoVideo, cache reaproveita
// (não consome quota Bing/Google duas vezes).
//
// O endpoint do PromoPage é GET ?q=<nome>&limite=1 — uma chamada por nome,
// em paralelo. Auth via cookie cross-subdomain (em prod) ou CORS dev.
// THRESHOLD pra auto-pick (search externo): só rejeita scores NEGATIVOS.
const SCORE_MIN_AUTO = 1;

// Busca a melhor imagem pra cada nome — mesma estratégia do PromoPage backend
// (server.js linha 371): PRIORIDADE MÁXIMA pra POPULARES (uploads + escolhas
// explícitas do user, peso >= 10). Search externo só como fallback.
//
// PASSOS por produto (cada nome roda em paralelo):
//   1. Consulta /api/produtos/imagens-populares (peso alto vence)
//      → se tem popular, RETORNA ela (não chama search externo)
//   2. Fallback: /api/produtos/buscar-imagens (Bing+OFF+Wikimedia)
//      → pega 1º candidato que passa threshold
//   3. Se nada bom: retorna null (frontend mostra placeholder)
//
// Resultado: depois que user escolhe a foto CERTA pra "Linguiça Seara" uma vez
// (peso 10 via 'USAR' OU peso 20 via upload), próximas buscas pelo mesmo nome
// vão DIRETO pra essa foto, sem cair no Bing que devolve Pizza Seara.
// Normaliza URL retornada pelo backend do PromoPage. Como o PromoVideo roda em
// videos.promopage.com.br, URLs relativas tipo "/uploads/produtos/x.jpg" iam
// resolver pra videos.promopage.com.br/uploads/... (não existe). Prefixa com
// o domínio do PromoPage pra evitar imagens crashadas.
//
// Casos:
//   - "/uploads/..." ou "/api/..." → prefixa API_PROMOPAGE
//   - URL absoluta (http...) → retorna como veio
//   - vazia/null → retorna como veio
export function normalizarUrlImagemPP(url) {
  if (!url) return url;
  if (url.startsWith('/uploads/') || url.startsWith('/api/')) {
    return `${API_PROMOPAGE}${url}`;
  }
  return url;
}

export async function buscarImagens(nomes) {
  const resultados = await Promise.all(nomes.map(async (nome) => {
    // 1) PRIORIDADE MÁXIMA: populares (banco compartilhado PP+PV)
    try {
      const rp = await fetch(
        `${API_PROMOPAGE}/api/produtos/imagens-populares?q=${encodeURIComponent(nome)}&limite=1`,
        { credentials: 'include' },
      );
      if (rp.ok) {
        const dp = await rp.json();
        const popular = (dp.imagens || [])[0];
        if (popular?.url) {
          return { nome, imagem: normalizarUrlImagemPP(popular.url), fonte: 'populares' };
        }
      }
    } catch { /* sem popular, segue pro search */ }

    // 2) Fallback: search externo (Bing+OFF+Wikimedia)
    try {
      const url = `${API_PROMOPAGE}/api/produtos/buscar-imagens?q=${encodeURIComponent(nome)}&limite=5`;
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) return { nome, imagem: null, fonte: null };
      const data = await r.json();
      const candidatos = data.imagens || [];
      const melhor = candidatos.find(c => c.score === undefined || c.score >= SCORE_MIN_AUTO);
      if (!melhor) return { nome, imagem: null, fonte: null, _baixaQualidade: true };
      return {
        nome,
        imagem: normalizarUrlImagemPP(melhor.url || melhor.thumbUrl || null),
        fonte: melhor.fonte || null,
      };
    } catch {
      return { nome, imagem: null, fonte: null };
    }
  }));
  return { resultados };
}

export async function criarVideo(payload) {
  const r = await apiFetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) {
    // Erro de cota tem .code (QUOTA_EXCEEDED|NO_PLAN) — propaga pra UI tratar.
    const err = new Error(data.erro || 'falha ao criar vídeo');
    err.code = data.code;
    err.cota = data.cota;
    err.status = r.status;
    throw err;
  }
  return data;
}

export async function getVideo(id) {
  const r = await fetch(`/api/videos/${id}`);
  if (!r.ok) throw new Error('falha ao consultar status');
  return r.json();
}

// Cota mensal de vídeos do user logado (consulta sem incrementar).
// Retorna { limite, usado, restante, anoMes, podeGerar, ilimitado }
export async function getVideoQuota() {
  try {
    const r = await apiFetch('/api/me/video-quota');
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// Headers do user logado — em dev, o frontend "diz" quem é (o useAuth gravou
// no localStorage). Em prod, o backend ignora esses headers (DEV_TRUST_PP_HEADERS
// é off) e usa o cookie real do .promopage.com.br. Pra dev cross-port, o
// header é a única forma do localhost:4020 saber quem está logado em :4010.
function ppHeaders() {
  try {
    const id = localStorage.getItem('pp_user_id');
    if (!id) return {};
    return {
      'X-Pp-User-Id': id,
      'X-Pp-User-Email': localStorage.getItem('pp_user_email') || '',
      'X-Pp-User-Nome': localStorage.getItem('pp_user_nome') || '',
      'X-Pp-User-IsAdmin': localStorage.getItem('pp_user_isadmin') || '0',
    };
  } catch { return {}; }
}
// Wrapper de fetch que SEMPRE envia credentials (pro cookie em prod) e headers
// do user (pro dev). Use nas chamadas autenticadas ao backend do PromoVideo.
function apiFetch(url, opts = {}) {
  const h = { ...(opts.headers || {}), ...ppHeaders() };
  return fetch(url, { ...opts, credentials: 'include', headers: h });
}

// === Favoritos de temas (autenticado) ===
export async function getFavoritos() {
  const r = await apiFetch('/api/temas-favoritos');
  if (!r.ok) return { favoritos: [] };
  return r.json();
}
export async function addFavorito(temaId) {
  const r = await apiFetch('/api/temas-favoritos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temaId }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'falha ao favoritar');
  return r.json();
}
export async function removeFavorito(temaId) {
  const r = await apiFetch(`/api/temas-favoritos/${encodeURIComponent(temaId)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'falha ao remover favorito');
  return r.json();
}

// === Projetos (inputs salvos por usuário) ===
const J = { 'Content-Type': 'application/json' };
export async function listarProjetos() {
  const r = await apiFetch('/api/projetos');
  if (!r.ok) return { projetos: [] };
  return r.json();
}
export async function obterProjeto(id) {
  const r = await apiFetch(`/api/projetos/${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'falha ao carregar projeto');
  return r.json();
}
export async function criarProjeto(nome, payload) {
  const r = await apiFetch('/api/projetos', { method: 'POST', headers: J, body: JSON.stringify({ nome, payload }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'falha ao salvar projeto');
  return r.json();
}
export async function atualizarProjeto(id, dados) {
  const r = await apiFetch(`/api/projetos/${encodeURIComponent(id)}`, { method: 'PUT', headers: J, body: JSON.stringify(dados) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'falha ao atualizar projeto');
  return r.json();
}
export async function excluirProjeto(id) {
  const r = await apiFetch(`/api/projetos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'falha ao excluir projeto');
  return r.json();
}
