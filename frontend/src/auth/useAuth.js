// Hook de autenticação do PromoVideo — usa a MESMA infra do PromoPage.
//
// Estratégia: PromoVideo NÃO tem auth próprio. Compartilha cookie cross-subdomain
// (.promopage.com.br) com o PromoPage. Em prod, login no PromoPage = automático no
// PromoVideo. Em dev, o user precisa logar separado (limitação de localhost).
//
// API_AUTH_BASE aponta pro backend do PromoPage:
//   - Prod: https://promopage.com.br (mesmo domínio, /api/* via Caddy)
//   - Dev: http://localhost:4010 (backend PromoPage rodando)
//
// IMPORTANTE: o backend do PromoPage precisa ter CORS configurado pra permitir
// origem do PromoVideo (videos.promopage.com.br em prod, localhost:5175 em dev).

import { useState, useEffect, useCallback } from 'react';

const API_AUTH_BASE = import.meta.env.PROD
  ? 'https://promopage.com.br'
  : 'http://localhost:4010';

// URL pra redirecionar pra tela de login do PromoPage (login "central").
// Após logar, user volta pro PromoVideo (?return=... pra preservar URL).
const URL_LOGIN_PROMOPAGE = import.meta.env.PROD
  ? 'https://promopage.com.br'
  : 'http://localhost:5173';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega user logado via cookie (cross-subdomain em prod).
  // Deriva isAdmin/isSuperAdmin do role_nome — backend retorna a string,
  // frontend trabalha com booleanos pra checagens de UI.
  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${API_AUTH_BASE}/api/auth/me`, {
        credentials: 'include',  // envia cookies (essencial pra cross-subdomain)
      });
      if (r.ok) {
        const d = await r.json();
        const u = d.user || null;
        if (u) {
          const role = u.role_nome || '';
          u.isSuperAdmin = role === 'super_admin';
          u.isAdmin = role === 'super_admin' || role === 'admin';
        }
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('[auth] falha ao carregar user:', e?.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // No mount: tenta carregar user via cookie.
  useEffect(() => {
    carregar();
  }, [carregar]);

  // Sincroniza o user no localStorage pra api.js poder mandar nos headers
  // (modo dev — em prod o cookie do PromoPage já resolve via .promopage.com.br).
  useEffect(() => {
    if (user) {
      localStorage.setItem('pp_user_id', String(user.id || ''));
      localStorage.setItem('pp_user_email', user.email || '');
      localStorage.setItem('pp_user_nome', user.nome || '');
      localStorage.setItem('pp_user_isadmin', user.isAdmin ? '1' : '0');
    } else {
      localStorage.removeItem('pp_user_id');
      localStorage.removeItem('pp_user_email');
      localStorage.removeItem('pp_user_nome');
      localStorage.removeItem('pp_user_isadmin');
    }
  }, [user]);

  // Login: redireciona pro PromoPage (login centralizado). User loga lá,
  // cookie é setado em .promopage.com.br, ao voltar pro PromoVideo o
  // useEffect acima detecta automaticamente.
  const abrirLoginPromoPage = useCallback(() => {
    window.open(URL_LOGIN_PROMOPAGE, '_blank', 'noopener');
  }, []);

  // Logout: chama o backend pra invalidar a sessão + limpar cookies.
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_AUTH_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('[auth] erro no logout:', e?.message);
    }
    setUser(null);
  }, []);

  // Fetch wrapper que SEMPRE envia credentials (pra requisições autenticadas
  // ao backend do PromoPage). Pra chamadas ao backend do PromoVideo (4020),
  // use fetch normal — ele não tem auth.
  const fetchAuth = useCallback((url, opts = {}) => {
    return fetch(url, { ...opts, credentials: 'include' });
  }, []);

  return {
    user,
    loading,
    abrirLoginPromoPage,
    logout,
    fetchAuth,
    refresh: carregar,
  };
}
