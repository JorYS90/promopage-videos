// Topbar do PromoVideo — compartilhada com PromoPage: mostra as DUAS logos
// lado a lado e área de auth à direita (login centralizado no PromoPage).
//
// Comportamento dos clicks:
//   - Logo PromoPage → abre PromoPage em NOVA aba
//   - Logo PromoVideo → home do PromoVideo
//   - Auth: deslogado abre PromoPage pra login; logado mostra avatar/dropdown

import BotaoAuthTopbar from '../auth/BotaoAuthTopbar.jsx';

const URL_PROMOPAGE = import.meta.env.PROD
  ? 'https://promopage.com.br'
  : 'http://localhost:5173';

export default function Topbar({
  aoRecursos, aoAtendimento, aoHome,
  user, loading, aoEntrar, aoLogout,
}) {
  return (
    <div className="topbar">
      {/* Logos lado a lado: PromoPage (irmã, abre em nova aba) + PromoVideo (app atual). */}
      <div className="topbar-logos">
        <a
          href={URL_PROMOPAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="logo-btn logo-promopage-link"
          title="Abrir PromoPage — gerador de encartes"
          aria-label="PromoPage — abrir gerador de encartes"
        >
          <img className="logo-img logo-img-promopage" src="/logo-promopage.png" alt="PromoPage" />
        </a>
        <span className="topbar-logo-divisor" aria-hidden="true" />
        <button
          type="button"
          className="logo-btn"
          onClick={aoHome}
          title="Voltar pro início do PromoVideo"
          aria-label="PromoVideo — voltar pro início"
        >
          <img className="logo-img" src="/LOGO_topbar.png" alt="PromoPage Vídeos" />
        </button>
      </div>

      <nav className="topbar-nav">
        <button className="topbar-nav-btn" onClick={aoRecursos}>Recursos e Planos</button>
        <button className="topbar-nav-btn" onClick={aoAtendimento}>Central de Atendimento</button>
      </nav>
      <div className="spacer" />
      <BotaoAuthTopbar
        user={user}
        loading={loading}
        aoEntrar={aoEntrar}
        aoLogout={aoLogout}
      />
    </div>
  );
}
