import { useState } from 'react';
import { uploadImagem } from '../api.js';
import { removerFundo } from '../remover-fundo.js';
import ModalEscolherImagem from './ModalEscolherImagem.jsx';

// Unidades (abreviação padrão de varejo BR) — value = abreviação usada no preço.
const UNIDADES = [
  { nome: 'Kilo', abrev: 'kg' }, { nome: 'Grama', abrev: 'g' }, { nome: '100 Gramas', abrev: '100g' },
  { nome: 'Litro', abrev: 'L' }, { nome: 'Ml', abrev: 'ml' }, { nome: 'Unidade', abrev: 'un' },
  { nome: 'Dúzia', abrev: 'dz' }, { nome: 'Cento', abrev: 'cto' }, { nome: 'Caixa', abrev: 'cx' },
  { nome: 'Pacote', abrev: 'pct' }, { nome: 'Lata', abrev: 'lt' }, { nome: 'Garrafa', abrev: 'grf' },
  { nome: 'Bandeja', abrev: 'bdj' }, { nome: 'Sachê', abrev: 'sch' }, { nome: 'Saco', abrev: 'sc' },
  { nome: 'Fardo', abrev: 'fd' }, { nome: 'Pote', abrev: 'pt' }, { nome: 'Balde', abrev: 'bld' },
  { nome: 'Peça', abrev: 'pç' }, { nome: 'Fatia', abrev: 'ft' }, { nome: 'Kit', abrev: 'kit' },
  { nome: 'Combo', abrev: 'cb' }, { nome: 'Cada', abrev: 'cd' },
];

export default function ModalEditarProdutos({ produtos, maxProdutos = 7, aoMudar, aoAdicionar, aoRemover, aoRemoverTodos, aoReordenar, aoBuscarImagem, buscandoIdx, aoFechar }) {
  const [processando, setProcessando] = useState(null); // idx em processamento
  const [arrastandoIdx, setArrastandoIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [dragArmadoIdx, setDragArmadoIdx] = useState(null);
  const [erro, setErro] = useState('');
  // Modal de seleção de imagem em GRID (chama backend do PromoPage).
  // escolherIdx = qual produto está com modal aberto; null = fechado.
  const [escolherIdx, setEscolherIdx] = useState(null);

  // Quando user clica "Buscar imagem" abre o modal de GRID em vez de pegar a 1ª foto.
  // Modal devolve a URL escolhida; aplica no produto + tenta remover fundo automático.
  // URL base do PromoPage (mesmo do api.js — duplicado pra evitar import).
  const API_PROMOPAGE = import.meta.env.PROD
    ? 'https://promopage.com.br'
    : 'http://localhost:4010';

  // Converte URL pra forma USÁVEL no card do produto e nos renders Remotion.
  // 3 casos:
  //   1. URL relativa do PromoPage ('/uploads/3/X.jpg') → prefixa API_PROMOPAGE
  //   2. URL externa (http://clickescolar.com.br/X.jpg) → passa pelo proxy do
  //      PromoPage (resolve CORS + cache no servidor)
  //   3. URL já do PromoPage (https://promopage.com.br/...) → usa direto
  function normalizarUrlImagem(url) {
    if (!url) return url;
    if (url.startsWith('/uploads/') || url.startsWith('/api/')) {
      return `${API_PROMOPAGE}${url}`;
    }
    if (url.startsWith('http')) {
      // URL externa — passa pelo proxy do PromoPage pra resolver CORS
      if (url.startsWith(API_PROMOPAGE)) return url;  // já é do PP
      return `${API_PROMOPAGE}/api/proxy-imagem-direto?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  // Aplica imagem escolhida no produto. Normaliza URL pra evitar CORS no
  // <img> do card (que não tem como mexer em headers).
  // User clica '✨ Remover fundo (IA)' DEPOIS pra tirar background se quiser.
  function aoEscolherImagem(idx, url) {
    if (!url || idx === null) return;
    const urlNormalizada = normalizarUrlImagem(url);
    aoMudar(idx, { ...produtos[idx], imagem: urlNormalizada, fundoRemovido: false });
  }

  async function enviarImagem(idx, file) {
    if (!file) return;
    setErro('');
    setProcessando(idx);
    try {
      const { url } = await uploadImagem(file, 'produto');
      // Remoção de fundo automática (chroma key; sem IA pra não travar).
      let finalUrl = url, removido = false;
      try {
        const blob = await removerFundo(url, { pularIA: true });
        if (blob) {
          const f = new File([blob], 'sem-fundo.png', { type: 'image/png' });
          finalUrl = (await uploadImagem(f, 'produto')).url;
          removido = true;
        }
      } catch { /* mantém original */ }
      aoMudar(idx, { ...produtos[idx], imagem: finalUrl, fundoRemovido: removido });
    } catch (e) { setErro(e.message); }
    finally { setProcessando(null); }
  }

  // Híbrido (igual PromoPage): chroma key primeiro (~5ms, p/ fundo branco/cinza
  // de catálogo) → IA com modelo FAST (~80MB) como fallback. Antes forçava IA
  // PRECISE (160MB) que demorava 5-10s + congelava UI.
  //
  // 3 cenários:
  //   - Fundo uniforme branco/cinza  → chroma key resolve em ms
  //   - Fundo complexo               → cai pra IA fast (mais rápida que precise)
  //   - Imagem cross-origin sem CORS → proxy via PromoPage pra evitar tainted canvas
  async function tirarFundo(idx) {
    const src = produtos[idx]?.imagem;
    if (!src) return;
    setErro('');
    setProcessando(idx);
    try {
      // Tenta híbrido: chroma key primeiro, IA fast se chroma falhar
      const blob = await removerFundo(src, { modeloIA: 'fast' });
      if (!blob) throw new Error('não foi possível remover o fundo');
      const file = new File([blob], 'sem-fundo.png', { type: 'image/png' });
      const { url } = await uploadImagem(file, 'produto');
      aoMudar(idx, { ...produtos[idx], imagem: url, fundoRemovido: true });
    } catch (e) {
      setErro('Falha ao remover fundo: ' + e.message);
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-editar" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Editar Produtos</h2>
            <div className="sub">Edite os dados dos produtos da sua oferta. A foto pode ser processada sem fundo.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-remover-todos" onClick={() => { if (confirm('Remover todos os produtos?')) aoRemoverTodos(); }}>🗑 Remover Todos</button>
            <button className="btn-concluir" onClick={aoFechar}>Concluir</button>
          </div>
        </div>

        <div className="modal-counter">{produtos.length} Produtos Selecionados</div>
        {erro && <div className="erro-box" style={{ margin: '0 0 12px' }}>{erro}</div>}

        {produtos.map((p, idx) => {
          const proc = processando === idx;
          const ehAlvo = hoverIdx === idx && arrastandoIdx !== null && arrastandoIdx !== idx;
          return (
            <div
              key={idx}
              className={`editar-row ${arrastandoIdx === idx ? 'arrastando' : ''} ${ehAlvo ? 'drop-alvo' : ''}`}
              draggable={dragArmadoIdx === idx}
              onDragStart={(e) => { if (dragArmadoIdx !== idx) { e.preventDefault(); return; } setArrastandoIdx(idx); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); }}
              onDragOver={(e) => { e.preventDefault(); if (hoverIdx !== idx) setHoverIdx(idx); }}
              onDragLeave={() => { if (hoverIdx === idx) setHoverIdx(null); }}
              onDrop={(e) => { e.preventDefault(); const de = parseInt(e.dataTransfer.getData('text/plain'), 10); if (!isNaN(de) && de !== idx) aoReordenar(de, idx); setArrastandoIdx(null); setHoverIdx(null); setDragArmadoIdx(null); }}
              onDragEnd={() => { setArrastandoIdx(null); setHoverIdx(null); setDragArmadoIdx(null); }}
            >
              <button
                type="button" className="editar-drag-handle" title="Arraste pra reordenar"
                onMouseDown={() => setDragArmadoIdx(idx)} onMouseUp={() => setDragArmadoIdx(null)} onClick={(e) => e.preventDefault()}
              >⠿</button>

              <div className="col-img">
                {/* PARIDADE COM PROMOPAGE: clicar no quadrado da imagem ABRE O MODAL
                    de escolha (grid de populares + internet) — NÃO abre file picker direto.
                    O upload de foto local está DENTRO do modal (botão "📤 Subir foto minha").
                    Antes era <label> com <input type="file"> — virou <div> + onClick que dispara modal. */}
                <div
                  className="img-wrapper-grande"
                  onClick={() => p.nome && !proc && setEscolherIdx(idx)}
                  style={{
                    cursor: p.nome && !proc ? 'pointer' : 'not-allowed',
                    ...(p.fundoRemovido ? { background: 'repeating-conic-gradient(#e9edf2 0% 25%, #fff 0% 50%) 50% / 16px 16px' } : {}),
                  }}
                  title={p.nome ? 'Clique pra escolher outra imagem (grid de opções + upload do PC)' : 'Digite o nome do produto primeiro'}
                >
                  {p.imagem ? <img src={normalizarUrlImagem(p.imagem)} alt="" /> : <div className="sem-img">📦</div>}
                  {proc && <div className="overlay-processando">Removendo fundo…</div>}
                  {!proc && <div className="overlay-trocar-grande">{p.imagem ? 'TROCAR IMAGEM' : 'ESCOLHER IMAGEM'}</div>}
                  {p.fundoRemovido && !proc && <span className="badge-sem-fundo">SEM FUNDO</span>}
                </div>
                {p.imagem && !proc && (
                  <button className="link-acao" onClick={() => tirarFundo(idx)} title="Use se o fundo automático não recortou bem (usa IA, ~3-5s)">✨ Remover fundo (IA)</button>
                )}
                {p.imagem && !p.fundoRemovido && !proc && (
                  <span className="dica-fundo">⚠ fundo não removido automaticamente — tente a IA</span>
                )}
              </div>

              <div className="col-campos">
                <div className="editar-campo">
                  <label>Produto</label>
                  <input type="text" value={p.nome} onChange={(e) => aoMudar(idx, { ...p, nome: e.target.value })} />
                </div>
                <div className="editar-campo">
                  <label>Preço Oferta</label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className="prefixo-rs">R$</span>
                    <input type="text" value={p.preco || ''} placeholder="0,00" style={{ flex: 1 }} onChange={(e) => aoMudar(idx, { ...p, preco: e.target.value })} />
                    <input type="text" value={p.precoDe || ''} placeholder="de (riscado)" style={{ width: 110 }} onChange={(e) => aoMudar(idx, { ...p, precoDe: e.target.value })} />
                  </div>
                </div>
                <div className="editar-campo">
                  <label>Texto de Observação</label>
                  <input type="text" value={p.info || ''} placeholder="Ex: próximo ao vencimento" onChange={(e) => aoMudar(idx, { ...p, info: e.target.value })} />
                </div>
              </div>

              <div className="col-opcoes">
                <div className="opcoes-tit">⚙ Opções de Preço <span>Preço Simples</span></div>
                <div className="editar-campo">
                  <label>Unidade</label>
                  <select value={p.unidade || ''} onChange={(e) => aoMudar(idx, { ...p, unidade: e.target.value })}>
                    <option value="">Escolha…</option>
                    {UNIDADES.map((u) => <option key={u.abrev + u.nome} value={u.abrev}>{u.nome} ({u.abrev})</option>)}
                  </select>
                </div>
                <label className="check-m18">
                  <input type="checkbox" checked={!!p.maioresDe18} onChange={(e) => aoMudar(idx, { ...p, maioresDe18: e.target.checked })} />
                  Apenas Maiores de 18
                </label>
              </div>

              <div className="editar-acoes">
                <button type="button" className="btn-arraste" title="Segure e arraste" onMouseDown={() => setDragArmadoIdx(idx)} onMouseUp={() => setDragArmadoIdx(null)} onClick={(e) => e.preventDefault()}>↕ ARRASTE</button>
                <button className="btn-remover-row" onClick={() => aoRemover(idx)}>🗑 Remover</button>
              </div>
            </div>
          );
        })}

        {produtos.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Nenhum produto. Adicione na aba Pesquisar.</div>}

        {produtos.length < maxProdutos && (
          <button className="btn btn-add" style={{ marginTop: 6 }} onClick={aoAdicionar}>+ Adicionar produto</button>
        )}
      </div>

      {/* Modal de seleção de imagem em grid — usa backend do PromoPage (cookie cross-subdomain) */}
      <ModalEscolherImagem
        aberto={escolherIdx !== null}
        queryInicial={escolherIdx !== null ? (produtos[escolherIdx]?.nome || '') : ''}
        aoFechar={() => setEscolherIdx(null)}
        aoEscolher={(url) => { aoEscolherImagem(escolherIdx, url); }}
      />
    </div>
  );
}
