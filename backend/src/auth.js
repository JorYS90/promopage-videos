// Auth COMPARTILHADA com o PromoPage — o PromoVideo não tem login próprio.
// O frontend manda o cookie de sessão do PromoPage (cross-subdomain em prod;
// limitado em dev). Aqui no backend a gente repassa o cookie pra o endpoint
// /api/auth/me do PromoPage; se ele retornar {user}, sabemos quem é.
//
// Em dev (PromoPage não rodando, ou cross-port atrapalhando o cookie), defina
// DEV_ALLOW_ADMIN=1 no .env do PromoVideo — todas as requisições passam como
// admin localmente.
//
// Quando o PromoPage emitir cookies/JWT próprios, basta ajustar a URL em
// config.PROMOPAGE_AUTH_URL — o resto continua igual.

const { PROMOPAGE_AUTH_URL, DEV_ALLOW_ADMIN, DEV_TRUST_PP_HEADERS } = require('./config');

const CACHE_TTL_MS = 30_000; // 30s — equilibra carga no PromoPage vs frescor
const cache = new Map(); // cookieHeader -> { user, exp }

// Deriva flags de role pro user vindo do PromoPage (que retorna role_nome).
// Faz isso AQUI (não no PromoPage) pra manter a API /me genérica e compatível
// com outros consumidores. Sem mutação se user for null/sem role_nome.
function enriquecerComRoleFlags(user) {
  if (!user) return null;
  const role = user.role_nome || '';
  return {
    ...user,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'super_admin' || role === 'admin',
  };
}

async function validarComPromopage(cookieHeader) {
  if (!cookieHeader) return null;
  const cached = cache.get(cookieHeader);
  if (cached && cached.exp > Date.now()) return cached.user;
  try {
    const r = await fetch(`${PROMOPAGE_AUTH_URL}/api/auth/me`, {
      headers: { cookie: cookieHeader },
    });
    if (!r.ok) {
      cache.set(cookieHeader, { user: null, exp: Date.now() + CACHE_TTL_MS });
      return null;
    }
    const d = await r.json().catch(() => ({}));
    const user = enriquecerComRoleFlags(d.user || null);
    cache.set(cookieHeader, { user, exp: Date.now() + CACHE_TTL_MS });
    return user;
  } catch (e) {
    // PromoPage offline / inacessível — não bloqueia, só não tem user.
    if (process.env.NODE_ENV !== 'test') console.warn('[auth] PromoPage indisponível:', e.message);
    return null;
  }
}

// Middleware: lê o cookie, valida com PromoPage, seta req.user. NÃO bloqueia.
async function lerAuth(req, _res, next) {
  if (DEV_ALLOW_ADMIN) {
    req.user = { id: 'dev', email: 'dev@local', isAdmin: true, _dev: true };
    return next();
  }
  // Dev cross-port: o frontend envia o user via headers X-Pp-User-* (sincronizado
  // pelo useAuth do PromoPage). Em PROD esta flag fica OFF — usa só o cookie.
  if (DEV_TRUST_PP_HEADERS) {
    const id = req.headers['x-pp-user-id'];
    if (id) {
      req.user = {
        id: String(id),
        email: String(req.headers['x-pp-user-email'] || ''),
        nome: String(req.headers['x-pp-user-nome'] || ''),
        isAdmin: req.headers['x-pp-user-isadmin'] === '1',
        _dev: true,
      };
      return next();
    }
  }
  req.user = await validarComPromopage(req.headers.cookie);
  next();
}

// Middleware: bloqueia (403) se não for admin (admin OU super_admin).
// Use em rotas administrativas comuns (relatórios, listagens, etc).
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ erro: 'acesso restrito ao admin (faça login no PromoPage)' });
  }
  next();
}

// Middleware: bloqueia (403) se não for super_admin.
// Use em rotas DESTRUTIVAS / de modelagem de conteúdo (criar/editar/excluir temas,
// modificar templates, etc). Admin comum NÃO passa — só o dono do sistema.
function requireSuperAdmin(req, res, next) {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({
      erro: 'acesso restrito ao super_admin (apenas o administrador do sistema)',
    });
  }
  next();
}

module.exports = { lerAuth, requireAdmin, requireSuperAdmin };
