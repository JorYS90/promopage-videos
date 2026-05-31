// Barra de ícones à esquerda — mesmo padrão visual do promopage.
export const SECOES = [
  { id: 'meusvideos', label: 'Meus Vídeos', icon: '🎞' },
  { id: 'produtos', label: 'Produtos', icon: '+' },
  { id: 'temas', label: 'Temas', icon: '🎨' },
  { id: 'logo', label: 'Sua Logo', icon: '©' },
  { id: 'empresa', label: 'Empresa', icon: '🏪' },
  { id: 'textos', label: 'Textos', icon: 'T' },
  { id: 'regras', label: 'Regras', icon: '⚖' },
  { id: 'gerar', label: 'Gerar', icon: '🎬' },
];

export default function IconBar({ ativa, aoMudar }) {
  return (
    <div className="icon-bar">
      {SECOES.map((s) => (
        <button
          key={s.id}
          className={ativa === s.id ? 'active' : ''}
          onClick={() => aoMudar(s.id)}
          title={s.label}
        >
          <span className="icon">{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
