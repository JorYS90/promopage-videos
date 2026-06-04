// Modais informativos abertos pelos botões do topo:
//  - ModalRecursosPlanos: planos REAIS puxados via /api/plans do PromoPage
//  - ModalAtendimento: canais de suporte
//
// Os planos vêm do PromoPage (single source of truth — mesma estrutura que aparece
// em promopage.com.br). Cross-origin: requer CORS habilitado no backend PromoPage.
// Pagamento real é redirecionado pro promopage.com.br (cookie + checkout MP).

import { useEffect, useState } from 'react';

// URL do backend do PromoPage (mesma config do useAuth)
const API_PROMOPAGE = import.meta.env.PROD
  ? 'https://promopage.com.br'
  : 'http://localhost:4010';

const URL_PROMOPAGE_PLANOS = import.meta.env.PROD
  ? 'https://promopage.com.br/?abrir=planos#recursos-e-planos'
  : 'http://localhost:5173/?abrir=planos#recursos-e-planos';

// === Ciclos suportados (espelha ModalPlanos do PromoPage) ===
const CICLOS = [
  { id: 'mensal',     label: 'Mensal',     meses: 1,  badge: null },
  { id: 'trimestral', label: 'Trimestral', meses: 3,  badge: '−3%' },
  { id: 'semestral',  label: 'Semestral',  meses: 6,  badge: '−7%' },
  { id: 'anual',      label: 'Anual',      meses: 12, badge: '−10%' },
];

const COLUNA_PRECO_POR_CICLO = {
  mensal: 'preco_mensal_centavos',
  trimestral: 'preco_trimestral_centavos',
  semestral: 'preco_semestral_centavos',
  anual: 'preco_anual_centavos',
};

const NOMES_RECURSOS = {
  pdf_export: 'Exportar PDF',
  png_export: 'Exportar PNG',
  temas_gratis: 'Temas grátis',
  temas_premium: 'Temas premium exclusivos',
  remover_fundo: 'Remover fundo das fotos (IA)',
  busca_avancada: 'Busca avançada de imagens',
  whatsapp_post: 'Postar direto no WhatsApp',
  multi_loja: 'Múltiplas lojas',
  api_access: 'Acesso à API',
  promovideo: 'Acesso ao PromoVideo',
};

function formatarReais(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ModalRecursosPlanos({ aoFechar }) {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [ciclo, setCiclo] = useState('mensal');

  useEffect(() => {
    let vivo = true;
    fetch(`${API_PROMOPAGE}/api/plans`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (vivo) setPlanos(d.plans || []); })
      .catch(e => { if (vivo) setErro(e.message); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, []);

  const cicloAtual = CICLOS.find(c => c.id === ciclo) || CICLOS[0];

  const abrirCheckoutPromopage = () => {
    // Pagamento real só funciona no domínio principal (cookie + Mercado Pago).
    // Abre em nova aba pro fluxo de checkout.
    window.open(URL_PROMOPAGE_PLANOS, '_blank', 'noopener');
  };

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-editar info-modal modal-planos-pv" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>💎 Recursos e Planos</h2>
            <div className="sub">Tudo do PromoPage + PromoVideo num único plano.</div>
          </div>
          <button className="btn btn-sm" onClick={aoFechar}>✕ Fechar</button>
        </div>

        {/* Toggle de ciclo (4 opções) */}
        <div className="mpv-ciclo-toggle">
          {CICLOS.map(c => (
            <button
              key={c.id}
              type="button"
              className={`mpv-ciclo-btn ${ciclo === c.id ? 'ativo' : ''}`}
              onClick={() => setCiclo(c.id)}
            >
              {c.label}
              {c.badge && <span className="mpv-ciclo-badge">{c.badge}</span>}
            </button>
          ))}
        </div>
        <p className="mpv-ciclo-hint">💳 Parcele no cartão em até 12×. PIX e boleto também.</p>

        {carregando && <p className="ajuda">Carregando planos...</p>}
        {erro && (
          <p className="ajuda" style={{ color: '#fca5a5' }}>
            Erro ao carregar planos: {erro}.{' '}
            <a href={URL_PROMOPAGE_PLANOS} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>
              Ver no site principal →
            </a>
          </p>
        )}

        {!carregando && !erro && (
          <div className="planos-grid mpv-grid">
            {planos.map(p => {
              const precoTotal = p[COLUNA_PRECO_POR_CICLO[ciclo]] || p.preco_mensal_centavos;
              const precoPorMes = Math.round(precoTotal / cicloAtual.meses);
              const destaque = p.slug === 'ilimitado_video_30';
              const limites = typeof p.limites === 'string' ? JSON.parse(p.limites) : (p.limites || {});
              const recursos = typeof p.recursos === 'string' ? JSON.parse(p.recursos) : (p.recursos || []);
              return (
                <div key={p.id} className={`plano-card ${destaque ? 'destaque' : ''}`}>
                  {destaque && <div className="plano-tag">Mais popular</div>}
                  <div className="plano-nome">{p.nome}</div>
                  <div className="plano-preco">
                    {formatarReais(precoPorMes)}
                    <span>/mês</span>
                  </div>
                  {ciclo !== 'mensal' && (
                    <div className="mpv-preco-total">
                      {formatarReais(precoTotal)} cobrado {
                        ciclo === 'anual' ? 'anualmente'
                          : ciclo === 'semestral' ? 'a cada 6 meses'
                          : 'a cada 3 meses'
                      }
                    </div>
                  )}

                  {limites.videosPorMes > 0 && (
                    <div className="mpv-cota-video">
                      🎬 <b>{limites.videosPorMes}</b> vídeos/mês no PromoVideo
                    </div>
                  )}
                  {limites.videosPorMes === 0 && (
                    <div className="mpv-cota-video sem-video">
                      🎬 PromoVideo não incluso
                    </div>
                  )}

                  <ul>
                    {recursos.slice(0, 6).map((r, i) => (
                      <li key={i}>{NOMES_RECURSOS[r] || r}</li>
                    ))}
                  </ul>

                  <button
                    className={`btn btn-bloco ${destaque ? 'btn-primary' : ''}`}
                    onClick={abrirCheckoutPromopage}
                  >
                    Escolher esse plano →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="ajuda" style={{ marginTop: 14, fontSize: 12 }}>
          💡 Os pagamentos são processados no <b>promopage.com.br</b> (cookie e checkout
          Mercado Pago). Você é redirecionado pra lá ao clicar em "Escolher".
        </p>
      </div>
    </div>
  );
}

const CONTATOS = [
  { ic: '✉️', label: 'E-mail', valor: 'atendimento@promopage.com.br', href: 'mailto:atendimento@promopage.com.br?subject=Contato%20PromoVideo' },
  { ic: '🕒', label: 'Horário', valor: 'Seg a Sex, 9h às 18h', href: null },
];

export function ModalAtendimento({ aoFechar }) {
  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-editar info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>💬 Central de Atendimento</h2>
            <div className="sub">Fale com a gente — estamos aqui pra ajudar.</div>
          </div>
          <button className="btn btn-sm" onClick={aoFechar}>✕ Fechar</button>
        </div>

        <div className="contato-grid">
          {CONTATOS.map((c) => {
            const Inner = (
              <>
                <span className="contato-ic">{c.ic}</span>
                <div>
                  <div className="contato-label">{c.label}</div>
                  <div className="contato-valor">{c.valor}</div>
                </div>
              </>
            );
            return c.href
              ? <a key={c.label} className="contato-item" href={c.href} target="_blank" rel="noreferrer">{Inner}</a>
              : <div key={c.label} className="contato-item">{Inner}</div>;
          })}
        </div>

        <p className="ajuda" style={{ marginTop: 14, fontSize: 12 }}>
          📧 Respondemos em até 24h em dias úteis. Pra problemas urgentes (vídeo travado,
          erro de cota), mande o ID do vídeo no assunto pra agilizar.
        </p>
      </div>
    </div>
  );
}
