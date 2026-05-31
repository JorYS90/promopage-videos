// Botão de auth na topbar do PromoVideo. Versão SIMPLIFICADA do que o
// PromoPage tem — não tem cadastro/recuperação aqui porque o login é
// CENTRALIZADO no PromoPage:
//
//   - Deslogado: botão "Entrar com PromoPage" → abre promopage.com.br em nova aba
//   - Logado: avatar com inicial + dropdown (logout)
//
// Pra trocar perfil, assinar, etc, o user vai pra promopage.com.br/conta.

import { useState, useRef, useEffect } from 'react';

export default function BotaoAuthTopbar({ user, loading, aoEntrar, aoLogout }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [aberto]);

  if (loading) {
    return <div className="auth-topbar auth-loading" aria-hidden="true">…</div>;
  }

  if (!user) {
    return (
      <div className="auth-topbar">
        <button
          type="button"
          className="auth-btn-pv"
          onClick={aoEntrar}
          title="Login centralizado via PromoPage (mesmas credenciais valem aqui)"
        >
          <span aria-hidden="true">🔑</span> Entrar com PromoPage
        </button>
      </div>
    );
  }

  const inicial = (user.nome || user.email || '?').trim()[0]?.toUpperCase() || '?';
  const primeiroNome = (user.nome || user.email).split(/[\s@]/)[0];

  return (
    <div className="auth-topbar logado" ref={ref}>
      <button
        type="button"
        className="auth-avatar-btn-pv"
        onClick={() => setAberto(v => !v)}
        title={`Conectado como ${user.email}`}
      >
        <span className="auth-avatar-pv">{inicial}</span>
        <span className="auth-nome-pv">{primeiroNome}</span>
        <span className="auth-chevron-pv">▾</span>
      </button>

      {aberto && (
        <div className="auth-dropdown-pv">
          <div className="auth-dd-header-pv">
            <div className="auth-dd-nome-pv">{user.nome}</div>
            <div className="auth-dd-email-pv">{user.email}</div>
          </div>
          <div className="auth-dd-sep-pv" />
          <a
            className="auth-dd-item-pv"
            href={import.meta.env.PROD ? 'https://promopage.com.br' : 'http://localhost:5173'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>👤</span> Meu Perfil (no PromoPage)
          </a>
          <div className="auth-dd-sep-pv" />
          <button
            type="button"
            className="auth-dd-item-pv auth-dd-item-danger-pv"
            onClick={() => { setAberto(false); aoLogout(); }}
          >
            <span>🚪</span> Sair
          </button>
        </div>
      )}
    </div>
  );
}
