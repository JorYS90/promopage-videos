// Badge horizontal que mostra "X/30 vídeos usados este mês" no topo do app.
// Vermelho quando atinge limite. Azul quando ilimitado (admin). Hidden quando
// não há quota carregada ou user sem login.

const NOMES_MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function formatarMes(anoMes) {
  if (!anoMes || anoMes === 'dev') return '';
  const [ano, mes] = anoMes.split('-');
  const idx = parseInt(mes, 10) - 1;
  if (idx < 0 || idx > 11) return '';
  return `${NOMES_MES[idx]}/${ano}`;
}

export default function VideoQuotaBadge({ quota, user, aoUpgrade }) {
  if (!user || !quota) return null;
  if (quota.semLogin) return null;

  // Ilimitado (admin): badge sutil
  if (quota.ilimitado) {
    return (
      <div className="vq-badge vq-ilimitado" title="Acesso ilimitado">
        <span className="vq-icone">∞</span>
        <span className="vq-texto">Vídeos ilimitados</span>
      </div>
    );
  }

  // Sem plano: convite pra upgrade
  if (quota.limite === 0) {
    return (
      <div className="vq-badge vq-sem-plano" onClick={aoUpgrade} role="button" tabIndex={0}>
        <span className="vq-icone">🎬</span>
        <div className="vq-texto-bloco">
          <strong>Desbloqueie o PromoVideo</strong>
          <span className="vq-sub">Assine "Ilimitado + 30 Vídeos" pra começar →</span>
        </div>
      </div>
    );
  }

  const restantePct = quota.limite > 0 ? (quota.restante / quota.limite) * 100 : 0;
  const critico = restantePct <= 10;
  const baixo = restantePct <= 25 && !critico;

  return (
    <div className={`vq-badge ${critico ? 'vq-critico' : baixo ? 'vq-baixo' : 'vq-ok'}`}>
      <span className="vq-icone">🎬</span>
      <div className="vq-texto-bloco">
        <span className="vq-numeros">
          <strong>{quota.usado}</strong>/{quota.limite}
          <span className="vq-label"> vídeos este mês</span>
        </span>
        <div className="vq-progresso-wrap">
          <div
            className="vq-progresso"
            style={{ width: `${Math.min(100, (quota.usado / quota.limite) * 100)}%` }}
          />
        </div>
      </div>
      {critico && (
        <button type="button" className="vq-cta" onClick={aoUpgrade}>
          Upgrade →
        </button>
      )}
      {quota.anoMes && (
        <span className="vq-mes" title={`Cota válida pra ${formatarMes(quota.anoMes)}`}>
          {formatarMes(quota.anoMes)}
        </span>
      )}
    </div>
  );
}
