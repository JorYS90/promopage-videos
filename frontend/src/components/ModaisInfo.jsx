// Modais informativos abertos pelos botões do topo:
//  - ModalRecursosPlanos: recursos do produto + planos/preços
//  - ModalAtendimento: canais de suporte
// Conteúdo inicial é placeholder — ajuste os textos/valores conforme seu negócio.

const RECURSOS = [
  '🎬 Vídeos promocionais automáticos em 3 formatos (Reels/Stories, Feed e TV/YouTube)',
  '🎨 Temas personalizados com o seu fundo, logo e cores',
  '🗣️ Narração com locutor profissional (voz por IA)',
  '🎵 Trilha sonora + efeitos sonoros de impacto',
  '🏷️ Balão de preço, validade e avisos legais automáticos',
  '⚡ Geração em minutos — é só colar os produtos',
];

const PLANOS = [
  { nome: 'Básico', preco: 'R$ 0', periodo: '/mês', destaque: false, itens: ['5 vídeos por mês', '1 formato', 'Marca d\'água'] },
  { nome: 'Profissional', preco: 'R$ 00', periodo: '/mês', destaque: true, itens: ['Vídeos ilimitados', '3 formatos', 'Sem marca d\'água', 'Narração com voz'] },
  { nome: 'Premium', preco: 'R$ 00', periodo: '/mês', destaque: false, itens: ['Tudo do Profissional', 'Temas exclusivos', 'Suporte prioritário'] },
];

export function ModalRecursosPlanos({ aoFechar }) {
  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-editar info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Recursos e Planos</h2>
            <div className="sub">Tudo o que você cria com o PromoPage Vídeos.</div>
          </div>
          <button className="btn btn-sm" onClick={aoFechar}>✕ Fechar</button>
        </div>

        <h3 className="secao-form">Recursos</h3>
        <ul className="info-lista">
          {RECURSOS.map((r, i) => <li key={i}>{r}</li>)}
        </ul>

        <h3 className="secao-form" style={{ marginTop: 18 }}>Planos</h3>
        <div className="planos-grid">
          {PLANOS.map((p) => (
            <div key={p.nome} className={`plano-card ${p.destaque ? 'destaque' : ''}`}>
              {p.destaque && <div className="plano-tag">Mais popular</div>}
              <div className="plano-nome">{p.nome}</div>
              <div className="plano-preco">{p.preco}<span>{p.periodo}</span></div>
              <ul>{p.itens.map((it, i) => <li key={i}>{it}</li>)}</ul>
              <button className={`btn btn-bloco ${p.destaque ? 'btn-primary' : ''}`}>Escolher</button>
            </div>
          ))}
        </div>
        <p className="ajuda" style={{ marginTop: 10 }}>* Valores e itens são exemplos — ajuste no código (ModaisInfo.jsx) conforme seus planos.</p>
      </div>
    </div>
  );
}

const CONTATOS = [
  { ic: '💬', label: 'WhatsApp', valor: '(00) 00000-0000', href: 'https://wa.me/5500000000000' },
  { ic: '✉️', label: 'E-mail', valor: 'suporte@promopagevideos.com', href: 'mailto:suporte@promopagevideos.com' },
  { ic: '📞', label: 'Telefone', valor: '(00) 0000-0000', href: 'tel:+5500000000' },
  { ic: '🕒', label: 'Horário', valor: 'Seg a Sex, 9h às 18h', href: null },
];

export function ModalAtendimento({ aoFechar }) {
  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-editar info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Central de Atendimento</h2>
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
        <p className="ajuda" style={{ marginTop: 12 }}>* Contatos de exemplo — ajuste no código (ModaisInfo.jsx) com os seus canais reais.</p>
      </div>
    </div>
  );
}
