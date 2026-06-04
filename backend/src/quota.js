// Cota mensal de vídeos — CHAMADA REMOTA pro PromoPage (single source of truth).
//
// O PromoPage tem a tabela video_usage + endpoint POST /api/me/consumir-video
// que faz check+increment atômico. Aqui só repassamos o cookie do user.
//
// Dev sem PromoPage rodando (DEV_ALLOW_ADMIN=1): bypass total — passa como
// ilimitado pra desenvolvedor não travar.

const { PROMOPAGE_AUTH_URL, DEV_ALLOW_ADMIN, DEV_TRUST_PP_HEADERS } = require('./config');

// Repassa cookie/headers da request original pra autenticar no PromoPage.
function headersDeAuth(req) {
  const h = {};
  if (req.headers.cookie) h.cookie = req.headers.cookie;
  // Em dev cross-port, frontend envia X-Pp-User-* — repassa.
  if (DEV_TRUST_PP_HEADERS) {
    for (const k of ['x-pp-user-id', 'x-pp-user-email', 'x-pp-user-nome', 'x-pp-user-isadmin']) {
      if (req.headers[k]) h[k] = req.headers[k];
    }
  }
  return h;
}

// GET /api/me/video-quota → status atual (sem incrementar)
async function status(req) {
  if (DEV_ALLOW_ADMIN) {
    return { limite: -1, usado: 0, restante: -1, anoMes: 'dev', podeGerar: true, ilimitado: true };
  }
  try {
    const r = await fetch(`${PROMOPAGE_AUTH_URL}/api/me/video-quota`, {
      headers: headersDeAuth(req),
    });
    if (!r.ok) return { limite: 0, usado: 0, restante: 0, podeGerar: false, _erro: `status ${r.status}` };
    return await r.json();
  } catch (e) {
    console.warn('[quota] PromoPage indisponível pra GET status:', e.message);
    return { limite: 0, usado: 0, restante: 0, podeGerar: false, _erro: 'OFFLINE' };
  }
}

// POST /api/me/consumir-video → check + increment atômico
// Retorna { ok: true, ...status } ou { ok: false, status: 403|429, mensagem, ...status }
async function consumir(req) {
  if (DEV_ALLOW_ADMIN) {
    return { ok: true, limite: -1, usado: 0, restante: -1, podeGerar: true, ilimitado: true };
  }
  try {
    const r = await fetch(`${PROMOPAGE_AUTH_URL}/api/me/consumir-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headersDeAuth(req) },
    });
    const json = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, ...json };
    return {
      ok: false,
      status: r.status,
      mensagem: json.error || `Bloqueado (${r.status})`,
      code: json.code || 'UNKNOWN',
      ...json,
    };
  } catch (e) {
    console.warn('[quota] PromoPage indisponível pra consumir:', e.message);
    return {
      ok: false,
      status: 503,
      mensagem: 'Não conseguimos validar sua cota agora. Tente novamente em alguns segundos.',
      code: 'OFFLINE',
    };
  }
}

module.exports = { status, consumir };
