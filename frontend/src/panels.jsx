// Painéis de conteúdo por seção. Todos recebem `ctx` (estado + ações do App).
import { useRef, useState } from 'react';
import ModalRecortarLogo from './components/ModalRecortarLogo.jsx';
import { normalizarUrlImagemPP } from './api.js';

// Seletor de voz de locutor (com prévia tocável).
function VozPicker({ vozes, vozId, onPick }) {
  const audioRef = useRef(null);
  const [tocando, setTocando] = useState('');
  if (!vozes.length) return null;
  const selId = vozId || vozes.find((x) => x.padrao)?.voice_id;
  const tocar = (v) => {
    if (audioRef.current) audioRef.current.pause();
    if (tocando === v.voice_id) { setTocando(''); return; }
    if (!v.preview) return;
    const a = new Audio(v.preview);
    audioRef.current = a;
    a.onended = () => setTocando('');
    a.play().then(() => setTocando(v.voice_id)).catch(() => setTocando(''));
  };
  return (
    <div className="campo">
      <label>🎙 Voz do locutor</label>
      <div className="voz-lib">
        {vozes.map((v) => (
          <div key={v.voice_id} className={`voz-item ${selId === v.voice_id ? 'sel' : ''}`}>
            <button type="button" className="voz-play" disabled={!v.preview} onClick={() => tocar(v)} title={v.preview ? 'Ouvir prévia' : 'Sem prévia'}>
              {tocando === v.voice_id ? '⏸' : '▶'}
            </button>
            <button type="button" className="voz-sel" onClick={() => onPick(v.voice_id)}>
              <span className="voz-nome">{v.nome}{v.padrao ? ' ⭐' : ''}</span>
              <span className="voz-perfil">{v.perfil}</span>
            </button>
          </div>
        ))}
      </div>
      <div className="dica" style={{ fontSize: 12, marginTop: 4 }}>Ouça a prévia (▶) e clique no nome pra escolher. ⭐ = padrão.</div>
    </div>
  );
}

function Titulo({ children, soon }) {
  return (
    <div className="painel-secao-tit">
      <h2 style={{ margin: 0 }}>{children}</h2>
      {soon && <span className="tag-soon">em breve</span>}
    </div>
  );
}

export function PanelProdutos({ ctx }) {
  const { produtos, removerProduto, limites, setCena, adicionarLista, abrirEditor, buscandoFotos } = ctx;
  const [tab, setTab] = useState('pesquisar');
  const [linhas, setLinhas] = useState('');

  const buscar = () => {
    if (!linhas.trim()) return;
    const qtd = adicionarLista(linhas);
    if (qtd > 0) { setLinhas(''); setTab('meus'); abrirEditor(); }
  };

  return (
    <>
      <div className="tabs">
        <button className={`tab ${tab === 'pesquisar' ? 'active' : ''}`} onClick={() => setTab('pesquisar')}>Pesquisar Produtos</button>
        <button className={`tab ${tab === 'meus' ? 'active' : ''}`} onClick={() => setTab('meus')}>Meus Produtos</button>
      </div>

      {tab === 'pesquisar' && (
        <>
          <div className="busca-card">
            <div className="busca-titulo">Digite ou Cole uma lista de produtos</div>
            <div className="busca-exemplo">Ex: Cerveja Brahma Lata de R$ 4,99 por R$ 3,99</div>
            <textarea
              className="busca-textarea"
              placeholder={"Cole / Escreva a lista aqui. Ex:\nPicanha kg R$ 49,90\nCoca-Cola 2L R$ 8,99 por R$ 6,99\nLeite Integral 1L R$ 3,79"}
              value={linhas}
              onChange={(e) => setLinhas(e.target.value)}
            />
            <button className="btn-buscar" onClick={buscar} disabled={!linhas.trim()}>🔍 Buscar Produtos</button>
          </div>
          <div className="aviso-ortografia">
            ⚠ <b>Confira a ortografia</b> antes de buscar — o nome que você digitar é o mesmo que vai escrito no vídeo e usado pra encontrar as fotos. Palavras erradas = foto errada e texto errado no vídeo final.
          </div>
          <div className="info-box">
            Cole uma lista do WhatsApp/planilha — o sistema detecta <b>nome</b>, <b>preço de/por</b> e <b>unidade</b>.
            Depois você ajusta tudo e adiciona as fotos em <b>Editar Produtos</b>.
            <div style={{ marginTop: 6 }}>Limite: {limites.minProdutos}–{limites.maxProdutos} produtos por vídeo.</div>
          </div>
        </>
      )}

      {tab === 'meus' && (
        <>
          <p className="ajuda">Produtos no vídeo: <b>{produtos.length}</b>. Clique pra ver na prévia, ou edite tudo de uma vez.</p>
          {buscandoFotos && <div className="info-box" style={{ marginBottom: 10 }}>🔎 Buscando fotos dos produtos na internet…</div>}
          {produtos.map((p, i) => (
            <div className="meu-produto" key={i} onClick={() => setCena(`produto-${i}`)}>
              <div className="mp-thumb">{p.imagem ? <img src={normalizarUrlImagemPP(p.imagem)} alt="" /> : '📦'}</div>
              <div className="mp-info">
                <div className="mp-nome">{(p.nome || `Produto ${i + 1}`).toUpperCase()}</div>
                <div className="mp-preco">{p.preco ? `R$ ${p.preco}${p.unidade ? ' /' + p.unidade : ''}` : 'sem preço'}</div>
              </div>
              {produtos.length > limites.minProdutos && (
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); removerProduto(i); }}>✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-primary btn-bloco" style={{ marginTop: 8 }} onClick={abrirEditor}>✏️ Editar Produtos</button>
        </>
      )}
    </>
  );
}

export function PanelFormato({ ctx }) {
  const { meta, formato, setFormato } = ctx;
  const mini = { vertical: { width: 54, height: 96 }, horizontal: { width: 96, height: 54 }, quadrado: { width: 72, height: 72 } };
  return (
    <>
      <Titulo>Formato do vídeo</Titulo>
      <p className="ajuda">Vertical pra Reels/Stories, horizontal pra TV interna/YouTube, quadrado pra feed.</p>
      <div className="opcoes" style={{ gridTemplateColumns: '1fr' }}>
        {meta.formatos.map((f) => (
          <button key={f.id} className={`opcao ${formato === f.id ? 'sel' : ''}`} onClick={() => setFormato(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="mini-frame" style={mini[f.id]}>{f.w}×{f.h}</div>
            <div>
              <div className="op-titulo">{f.nome}</div>
              <div className="op-sub">{f.w}×{f.h}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

export function PanelTemas({ ctx }) {
  const { temas, temaSelecionado, setTema, abrirCriarTema, editarTema, removerTema, isAdmin, user, favoritos, toggleFavorito } = ctx;
  const [busca, setBusca] = useState('');
  const [mostrarFavs, setMostrarFavs] = useState(false);

  // Filtro de pesquisa (nome / categoria / segmento) + filtro de favoritos.
  const q = busca.trim().toLowerCase();
  let visiveis = q
    ? temas.filter((t) => [t.nome, t.categoria, t.segmento].some((s) => (s || '').toLowerCase().includes(q)))
    : temas;
  if (mostrarFavs) visiveis = visiveis.filter((t) => favoritos?.has(t.id));

  // Agrupa por categoria, mantendo a ordem de chegada.
  const grupos = {};
  for (const t of visiveis) {
    const cat = t.categoria || 'Outros';
    (grupos[cat] = grupos[cat] || []).push(t);
  }

  const primeiroBg = (t) => {
    const b = t.backgrounds || {};
    for (const fmt of ['vertical', 'horizontal', 'quadrado']) {
      const f = b[fmt];
      if (f && (f.produtos || f.intro || f.ctaFim)) return f.produtos || f.intro || f.ctaFim;
    }
    return null;
  };
  const thumb = (t) => {
    const img = t.tipo === 'imagem' ? primeiroBg(t) : null;
    if (img) return <div className="tema-thumb"><img src={img} alt="" /></div>;
    return (
      <div className="tema-thumb" style={{ background: `linear-gradient(135deg, ${t.fundo}, ${t.fundoAlt})` }}>
        <span style={{ color: t.destaque, fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>{(t.segmento || '').toUpperCase()}</span>
      </div>
    );
  };

  return (
    <>
      <Titulo>Temas</Titulo>

      {/* Barra de pesquisa */}
      <div className="tema-busca">
        <input
          type="text"
          placeholder="Pesquisa de TEMAS · Ex: Supermercado"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {busca && <button className="tema-busca-x" title="Limpar" onClick={() => setBusca('')}>✕</button>}
        <button className="btn btn-primary btn-sm tema-busca-btn">Buscar</button>
      </div>

      {/* Lançamentos */}
      <div className="tema-lancamentos">
        ✨ Lançamos <b>{temas.length} tema{temas.length !== 1 ? 's' : ''}</b> {temas.length !== 1 ? 'recentes' : 'recente'}!
      </div>

      {/* MEUS FAVORITOS — toggle de filtro */}
      <button
        type="button"
        className={`btn-favoritos-temas ${mostrarFavs ? 'ativo' : ''}`}
        onClick={() => setMostrarFavs((v) => !v)}
        title={mostrarFavs ? 'Mostrar todos os temas' : 'Ver meus temas favoritos'}
      >
        💖 MEUS FAVORITOS
        {favoritos?.size > 0 && <span className="bft-count">{favoritos.size}</span>}
      </button>

      {/* Criar tema — só admin */}
      {isAdmin && (
        <button className="btn btn-primary btn-bloco" onClick={abrirCriarTema} style={{ marginBottom: 8 }}>+ Criar Meu Tema</button>
      )}
      <p className="ajuda">O tema é o fundo pronto (Intro, Produtos, CTA/Fim). Você só insere os produtos — eles aparecem por cima automaticamente.</p>

      {!visiveis.length && (
        <p className="ajuda">
          {mostrarFavs
            ? (user
                ? <>Você ainda não favoritou nenhum tema.<br />Clique no <b>♡</b> de um card pra salvar.</>
                : <>Faça <b>login no PromoPage</b> pra ver seus temas favoritos aqui.</>)
            : <>Nenhum tema encontrado para “{busca}”.</>}
        </p>
      )}

      {Object.entries(grupos).map(([cat, lista]) => (
        <div key={cat} className="tema-grupo">
          <div className="tema-grupo-tit">{cat}</div>
          <div className="tema-grid">
            {lista.map((t) => {
              const isFav = !!favoritos?.has(t.id);
              return (
                <div key={t.id} className={`tema-card ${temaSelecionado.id === t.id ? 'sel' : ''}`} onClick={() => setTema(t)}>
                  {thumb(t)}
                  <div className="tema-nome">{t.nome}</div>
                  {/* ❤️ favorito — pra todos os usuários logados */}
                  <button
                    type="button"
                    className={`tc-fav ${isFav ? 'on' : ''}`}
                    title={isFav ? 'Remover dos favoritos' : 'Salvar como favorito'}
                    onClick={(e) => { e.stopPropagation(); toggleFavorito?.(t.id); }}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>
                  {isAdmin && t.custom && (
                    <div className="tema-acoes">
                      <button className="tc-btn" title="Editar tema" onClick={(e) => { e.stopPropagation(); editarTema(t); }}>✏️</button>
                      <button className="tc-btn del" title="Excluir tema" onClick={(e) => { e.stopPropagation(); removerTema(t); }}>🗑</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

const FUNDOS_LOGO = [
  { id: 'escuro', label: 'Fundo Escuro', bg: '#1f2937', shape: 'rect' },
  { id: 'escuro-redondo', label: 'Fundo Escuro Redondo', bg: '#1f2937', shape: 'circle' },
  { id: 'claro', label: 'Fundo Claro', bg: '#ffffff', shape: 'rect' },
  { id: 'claro-redondo', label: 'Fundo Claro Redondo', bg: '#ffffff', shape: 'circle' },
  { id: 'transparente', label: 'Sem Fundo', bg: 'transparent', shape: 'none' },
];

// Lista de projetos salvos do usuário (vídeos privados). Carrega → editar →
// re-gerar sem precisar digitar tudo de novo.
export function PanelMeusVideos({ ctx }) {
  const { user, projetos, projetoAtualId, carregarProjeto, removerProjeto, novoProjeto, setSecao } = ctx;
  const fmtData = (iso) => { try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return ''; } };

  if (!user) {
    return (
      <>
        <Titulo>Meus Vídeos</Titulo>
        <div className="info-box">
          Faça <b>login no PromoPage</b> (botão "Entrar com PromoPage" no topo) pra salvar seus vídeos e voltar a editar depois.
        </div>
      </>
    );
  }

  return (
    <>
      <Titulo>Meus Vídeos</Titulo>
      <p className="ajuda">Cada vídeo seu fica salvo na sua conta — clique pra <b>continuar editando</b> ou apagar.</p>

      <button className="btn btn-primary btn-bloco" onClick={() => { novoProjeto(); setSecao('produtos'); }} style={{ marginBottom: 12 }}>
        + Começar um novo
      </button>

      {!projetos.length && (
        <div className="info-box">Você ainda não salvou nenhum vídeo. Vá em <b>Gerar</b> e clique em <b>💾 Salvar projeto</b> pra começar.</div>
      )}

      <div className="meus-videos-lista">
        {projetos.map((p) => {
          const ativo = projetoAtualId === p.id;
          const n = p.payload?.produtos?.length || 0;
          const fmt = p.payload?.formato || 'vertical';
          return (
            <div key={p.id} className={`meu-video-card ${ativo ? 'sel' : ''}`}>
              <button className="mv-card-main" onClick={() => carregarProjeto(p)} title="Abrir projeto">
                <div className="mv-titulo">{p.nome}{ativo && ' · em edição'}</div>
                <div className="mv-meta">
                  <span>📐 {fmt}</span>
                  <span>📦 {n} produto{n !== 1 ? 's' : ''}</span>
                  <span>🕒 {fmtData(p.atualizadoEm)}</span>
                </div>
              </button>
              <button className="mv-card-del" title="Excluir projeto" onClick={() => removerProjeto(p)}>🗑</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function PanelEmpresa({ ctx }) {
  const { empresa, setEmpresa } = ctx;
  const set = (campo) => (e) => setEmpresa((x) => ({ ...x, [campo]: e.target.value }));
  return (
    <>
      <Titulo>Empresa</Titulo>
      <p className="ajuda">Dados da sua loja. O <b>nome</b> aparece na abertura e no encerramento; os contatos aparecem no <b>card de encerramento</b>. Deixe em branco o que não quiser mostrar.</p>

      <div className="campo">
        <label>Nome da empresa <span className="dica">— obrigatório</span></label>
        <input type="text" placeholder="Ex.: Supermercado São Marcos" value={empresa.nome} onChange={set('nome')} />
      </div>

      <h3 className="secao-form" style={{ marginTop: 18 }}>Contatos da loja</h3>
      <p className="ajuda" style={{ marginTop: -6 }}>Aparecem no card de encerramento do vídeo.</p>
      <div className="campo">
        <label>Endereço</label>
        <input type="text" placeholder="Av. Brasil, 1234 - Centro" value={empresa.endereco || ''} onChange={set('endereco')} />
      </div>
      <div className="campo">
        <label>Telefone</label>
        <input type="text" placeholder="(11) 3333-0000" value={empresa.telefone || ''} onChange={set('telefone')} />
      </div>
      <div className="campo">
        <label>WhatsApp</label>
        <input type="text" placeholder="(11) 90000-0000" value={empresa.whatsapp || ''} onChange={set('whatsapp')} />
      </div>
      <div className="campo">
        <label>Site</label>
        <input type="text" placeholder="loja.com.br" value={empresa.site || ''} onChange={set('site')} />
      </div>
      <div className="campo">
        <label>Instagram</label>
        <input type="text" placeholder="@sualoja" value={empresa.instagram || ''} onChange={set('instagram')} />
      </div>
      <div className="linha">
        <div className="campo" style={{ marginBottom: 0 }}>
          <label>Dias</label>
          <input type="text" placeholder="Seg a Sáb" value={empresa.dias || ''} onChange={set('dias')} />
        </div>
        <div className="campo" style={{ marginBottom: 0 }}>
          <label>Horário</label>
          <input type="text" placeholder="8h às 20h" value={empresa.horario || ''} onChange={set('horario')} />
        </div>
      </div>
    </>
  );
}

export function PanelLogo({ ctx }) {
  const { empresa, setEmpresa, onUpload } = ctx;
  const [urlPendente, setUrlPendente] = useState('');
  const logo = empresa.logo;
  const fundo = empresa.logoFundo || 'transparente';
  // Sobe a imagem crua e abre o modal de recorte/remover fundo.
  const enviar = (file) => onUpload(file, (url) => setUrlPendente(url), 'logo');
  const remover = () => { if (confirm('Remover a logo?')) setEmpresa((e) => ({ ...e, logo: '' })); };

  return (
    <>
      {urlPendente && (
        <ModalRecortarLogo
          urlOriginal={urlPendente}
          aoFechar={() => setUrlPendente('')}
          aoSalvar={(url) => setEmpresa((e) => ({ ...e, logo: url }))}
        />
      )}
      <Titulo>Sua Logo</Titulo>
      <p className="ajuda">Envie sua logo e escolha o fundo onde ela fica melhor. Ela aparece na abertura e no encerramento.</p>

      {!logo ? (
        <label className="logo-drop">
          <input type="file" accept="image/*" hidden onChange={(e) => enviar(e.target.files[0])} />
          <span className="logo-drop-texto">📎 Clique para enviar sua logo</span>
        </label>
      ) : (
        <>
          <div className="logo-card-principal">
            <label className="logo-imagem-clicavel" title="Clique pra trocar a logo">
              <img src={logo} alt="Logo" />
              <input type="file" accept="image/*" hidden onChange={(e) => enviar(e.target.files[0])} />
            </label>
            <div className="logo-card-instrucao">Clique na logo para trocar.</div>
          </div>

          <h3 className="secao-form">Escolha o melhor fundo</h3>
          <p className="ajuda" style={{ marginTop: -6 }}>Escolha em qual tipo de fundo sua logo fica melhor.</p>
          <div className="logo-fundos-cards">
            {FUNDOS_LOGO.map((f) => {
              const ativo = fundo === f.id;
              const style = {
                ...(f.bg !== 'transparent' ? { background: f.bg } : {}),
                ...(f.shape === 'circle' ? { borderRadius: '50%' } : {}),
                ...(f.shape !== 'none' ? { border: '2px solid var(--borda)' } : { border: '2px dashed var(--borda)' }),
              };
              return (
                <div key={f.id} className={`logo-fundo-card ${ativo ? 'ativo' : ''}`}>
                  <div className="logo-fundo-preview" style={style}><img src={logo} alt="" /></div>
                  <div className="logo-fundo-label">{f.label}</div>
                  <button className={`btn btn-sm btn-bloco ${ativo ? 'btn-ok' : ''}`} onClick={() => setEmpresa((e) => ({ ...e, logoFundo: f.id }))}>
                    {ativo ? '✓ Selecionado' : 'Selecionar'}
                  </button>
                </div>
              );
            })}
          </div>

          <button className="btn btn-bloco" style={{ marginTop: 12 }} onClick={remover}>🗑 Remover logo</button>
        </>
      )}
      <p className="ajuda" style={{ marginTop: 18 }}>Os dados da loja (endereço, telefone, etc.) ficam na aba <b>Empresa</b>.</p>
    </>
  );
}

export function PanelTextos({ ctx }) {
  const { textos, setTextos, onUpload, musicas, vozes, meta, isAdmin } = ctx;
  return (
    <>
      <Titulo>Textos</Titulo>
      <p className="ajuda">Esses textos aparecem na abertura, na chamada e no encerramento. Deixe em branco pra usar o padrão do segmento{meta.ia.texto ? ' ou gerar com IA' : ''}.</p>
      {meta.ia.texto && (
        <div className="campo">
          <label className="toggle">
            <input type="checkbox" checked={textos.usarIA} onChange={(e) => setTextos((x) => ({ ...x, usarIA: e.target.checked }))} />
            Gerar textos com IA (campos em branco)
          </label>
        </div>
      )}
      {/* Narração com voz: exclusivo do SUPERADMIN (gasta crédito ElevenLabs).
          Login compartilhado com o PromoPage define quem é admin. */}
      {isAdmin && meta.ia.voz && (
        <div className="campo">
          <label className="toggle">
            <input type="checkbox" checked={textos.narracao} onChange={(e) => setTextos((x) => ({ ...x, narracao: e.target.checked }))} />
            🔊 Narração por voz (abertura, CTA e encerramento)
          </label>
        </div>
      )}
      {isAdmin && !meta.ia.voz && (
        <div className="info-box" style={{ marginBottom: 14 }}>
          🔊 <b>Narração por voz</b> das ofertas: configure <b>ELEVENLABS_API_KEY</b> no <code>backend/.env</code> pra narrar abertura, CTA e encerramento. Sem a chave, o vídeo fica só escrito.
        </div>
      )}
      {isAdmin && meta.ia.voz && textos.narracao !== false && (
        <VozPicker vozes={vozes || []} vozId={textos.vozId} onPick={(id) => setTextos((x) => ({ ...x, vozId: id }))} />
      )}
      <div className="campo">
        <label className="toggle">
          <input type="checkbox" checked={textos.sfx !== false} onChange={(e) => setTextos((x) => ({ ...x, sfx: e.target.checked }))} />
          💥 Efeitos sonoros de impacto (whoosh nas trocas, "pop" no preço)
        </label>
      </div>
      <div className="campo">
        <label>Abertura da semana <span className="dica">— intro</span></label>
        <input type="text" placeholder="Ofertas da semana no..." value={textos.introTexto} onChange={(e) => setTextos((x) => ({ ...x, introTexto: e.target.value }))} />
      </div>
      <div className="campo">
        <label>CTA <span className="dica">— chamada pra ação</span></label>
        <input type="text" placeholder="Corre aproveitar!" value={textos.cta} onChange={(e) => setTextos((x) => ({ ...x, cta: e.target.value }))} />
      </div>
      <div className="campo">
        <label>Encerramento</label>
        <input type="text" placeholder="Venha conferir nossa loja" value={textos.finalTexto} onChange={(e) => setTextos((x) => ({ ...x, finalTexto: e.target.value }))} />
      </div>

      <div className="campo">
        <label>🎵 Trilha sonora <span className="dica">(opcional)</span></label>
        {textos.trilha && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <audio src={textos.trilha} controls style={{ height: 34, flex: 1, minWidth: 0 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => setTextos((x) => ({ ...x, trilha: '' }))}>tirar</button>
          </div>
        )}
        {musicas.length > 0 && (
          <div className="trilha-lib">
            {musicas.map((m) => (
              <button key={m.url} type="button" className={`trilha-item ${textos.trilha === m.url ? 'sel' : ''}`} onClick={() => setTextos((x) => ({ ...x, trilha: m.url }))}>
                🎵 {m.nome}
                {m.credito && <span className="trilha-credito"> · {m.credito}</span>}
              </button>
            ))}
          </div>
        )}
        {(() => {
          const sel = musicas.find((m) => m.url === textos.trilha);
          return sel?.credito ? (
            <div className="dica" style={{ fontSize: 12, marginTop: 6 }}>
              ⚖ Trilha <b>{sel.credito}</b> exige atribuição — o crédito entra automaticamente no card final do vídeo.
            </div>
          ) : null;
        })()}
        <label className="btn btn-sm btn-bloco" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', marginTop: 8 }}>
          📎 Enviar minha música
          <input type="file" accept="audio/*" hidden onChange={(e) => onUpload(e.target.files[0], (url) => setTextos((x) => ({ ...x, trilha: url })), 'musica')} />
        </label>
        <div className="dica" style={{ fontSize: 12, marginTop: 4 }}>
          {musicas.length > 0
            ? 'Escolha da biblioteca ou envie a sua (royalty-free). Fica em volume baixo sob a narração.'
            : 'Envie uma música royalty-free, ou coloque trilhas em backend/musicas/ pra montar sua biblioteca.'}
        </div>
      </div>
    </>
  );
}

export function PanelRegras({ ctx }) {
  const { regras, setRegras } = ctx;
  const set = (k, v) => setRegras((r) => ({ ...r, [k]: v }));
  const TOGGLES = [
    ['mostrarDatas', 'Mostrar datas da oferta'],
    ['enquantoEstoque', 'Enquanto durarem os estoques'],
    ['imagensIlustrativas', 'Imagens meramente ilustrativas'],
    ['advertenciaMedicamento', 'Advertência de medicamento'],
    ['mostrarFrase', 'Mostrar frase promocional'],
  ];
  return (
    <>
      <Titulo>Regras</Titulo>
      <p className="ajuda">Período da oferta e avisos legais do comercial. <b>Onde e quando</b> aparecem nas cenas a gente ajusta depois.</p>

      <h3 className="secao-form">📅 Período da oferta</h3>
      <div className="linha">
        <div className="campo" style={{ marginBottom: 0 }}>
          <label>Data de início</label>
          <input type="date" value={regras.dataInicio} onChange={(e) => set('dataInicio', e.target.value)} />
        </div>
        <div className="campo" style={{ marginBottom: 0 }}>
          <label>Data final</label>
          <input type="date" value={regras.dataFinal} onChange={(e) => set('dataFinal', e.target.value)} />
        </div>
      </div>

      <h3 className="secao-form">⚙ Regras visíveis no vídeo</h3>
      {TOGGLES.map(([k, label]) => (
        <div className="campo" key={k} style={{ marginBottom: 8 }}>
          <label className="toggle">
            <input type="checkbox" checked={!!regras[k]} onChange={(e) => set(k, e.target.checked)} />
            {label}
          </label>
        </div>
      ))}

      <h3 className="secao-form">💬 Frase promocional</h3>
      <div className="campo">
        <textarea rows={3} placeholder="Ex: Venha aproveitar nossa promoção de fim de mês!" value={regras.frasePromocional} onChange={(e) => set('frasePromocional', e.target.value)} />
        <div className="dica" style={{ fontSize: 12, marginTop: 4 }}>Aparece no rodapé do vídeo. Ative “Mostrar frase promocional” acima pra exibi-la.</div>
      </div>
    </>
  );
}

export function PanelGerar({ ctx }) {
  const { formato, temaSelecionado, produtos, gerar, job, podeGerar, reset, user, salvarProjeto, projetoAtualId } = ctx;
  return (
    <>
      <Titulo>Gerar vídeo</Titulo>
      <div className="info-box" style={{ marginBottom: 16 }}>
        <div><b>Formato:</b> {formato}</div>
        <div><b>Tema:</b> {temaSelecionado?.nome}</div>
        <div><b>Produtos:</b> {produtos.filter((p) => p.nome && p.preco).length}</div>
      </div>
      {(!job || job.status === 'done' || job.status === 'error') && (
        <button className="btn btn-primary btn-bloco" disabled={!podeGerar} onClick={gerar}>🎬 Gerar vídeo</button>
      )}
      {/* Salvar projeto: vincula o estado atual à conta do user pra reabrir/editar depois. */}
      {user && (
        <button className="btn btn-bloco" style={{ marginTop: 8 }} onClick={salvarProjeto} title="Salvar este vídeo na sua conta">
          💾 {projetoAtualId ? 'Salvar alterações' : 'Salvar como meu vídeo'}
        </button>
      )}
      {!podeGerar && <p className="ajuda" style={{ marginTop: 10 }}>Preencha o nome da empresa e ao menos {meta.limites.minProdutos} produtos (nome + preço).</p>}
      {job && job.status === 'error' && <div className="erro-box">Falha: {job.error}</div>}
      {job && (job.status === 'processing' || job.status === 'queued') && <p className="ajuda" style={{ marginTop: 10 }}>Acompanhe na prévia ao lado…</p>}
      {job && job.status === 'done' && <button className="btn btn-bloco" style={{ marginTop: 10 }} onClick={reset}>Criar outro vídeo</button>}
    </>
  );
}
