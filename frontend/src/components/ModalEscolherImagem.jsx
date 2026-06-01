// Modal de seleção de imagem em grid — IDÊNTICO ao do PromoPage mas adaptado
// pra chamar o backend do PromoPage diretamente (cookie cross-subdomain).
//
// Permite ao user:
//   - Ver 20 imagens em grid (populares do banco + internet)
//   - Refinar a busca
//   - Subir foto própria (peso máximo no aprendizado)
//   - Clicar → "USAR" pra confirmar
//
// Endpoint compartilhado: PromoPage backend (4010 dev, promopage.com.br prod).

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const API_PROMOPAGE = import.meta.env.PROD
  ? 'https://promopage.com.br'
  : 'http://localhost:4010';

export default function ModalEscolherImagem({ aberto, queryInicial, aoFechar, aoEscolher }) {
  const [query, setQuery] = useState(queryInicial || '');
  const [imagens, setImagens] = useState([]);
  const [populares, setPopulares] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [selecionada, setSelecionada] = useState(null);
  const [enviandoUpload, setEnviandoUpload] = useState(false);
  const inputFileRef = useRef(null);

  useEffect(() => {
    if (aberto && queryInicial) {
      setQuery(queryInicial);
      buscarPopulares(queryInicial);
      buscar(queryInicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, queryInicial]);

  // Imagens "populares" (banco interno do PromoPage) — sempre mostradas primeiro.
  const buscarPopulares = async (q) => {
    if (!q.trim()) return;
    try {
      const r = await fetch(
        `${API_PROMOPAGE}/api/produtos/imagens-populares?q=${encodeURIComponent(q)}&limite=20`,
        { credentials: 'include' },
      );
      const json = await r.json();
      setPopulares(json.imagens || []);
    } catch {
      setPopulares([]);
    }
  };

  // Busca via Bing/Google/OFF — pode demorar 3-8s (cada fonte externa lenta).
  // Pedimos 24 (em vez de 12) pra ter mais opções no grid.
  const buscar = async (q) => {
    if (!q.trim()) return;
    setCarregando(true);
    setSelecionada(null);
    try {
      const r = await fetch(
        `${API_PROMOPAGE}/api/produtos/buscar-imagens?q=${encodeURIComponent(q)}&limite=24`,
        { credentials: 'include' },
      );
      const json = await r.json();
      setImagens(json.imagens || []);
    } catch (e) {
      alert('Erro ao buscar imagens: ' + e.message);
    } finally {
      setCarregando(false);
    }
  };

  // Lista combinada — populares primeiro (com badge "✓ Sua foto"), internet
  // preenche até 30. Quanto MAIS opções, melhor a chance do user achar a foto
  // certa sem precisar refinar a busca várias vezes.
  const MAX_TOTAL = 30;
  const listaCombinada = (() => {
    const vistas = new Set();
    const out = [];
    for (const p of populares) {
      if (out.length >= MAX_TOTAL) break;
      if (!p.url || vistas.has(p.url)) continue;
      vistas.add(p.url);
      out.push({ url: p.url, titulo: '', isPopular: true });
    }
    for (const w of imagens) {
      if (out.length >= MAX_TOTAL) break;
      if (!w.url || vistas.has(w.url)) continue;
      vistas.add(w.url);
      out.push({ url: w.url, titulo: w.titulo || '', isPopular: false });
    }
    return out;
  })();

  const selecionar = (i) => setSelecionada(i);

  // Quando user confirma a escolha (✓ USAR): aplica a URL E ensina o sistema.
  // PESO 10 = sinal MÉDIO ('escolha explícita do user'). Vai pro banco compartilhado
  // do PromoPage — próxima busca pelo MESMO nome de produto (em qualquer app)
  // prioriza essa foto como popular. Sem isso, o sistema nunca aprende qual foto é
  // a CERTA pra "Linguiça Seara" e continua devolvendo Pizza Seara no #1.
  // (Upload manual = peso 20, mais forte. Só selecionar do grid = peso 10.)
  const confirmarEscolha = () => {
    if (selecionada === null) return;
    const item = listaCombinada[selecionada];
    if (!item) return;
    // Registra a escolha no banco de populares (não bloqueia em erro)
    const nome = (queryInicial || query || '').trim();
    if (nome && item.url) {
      fetch(`${API_PROMOPAGE}/api/produtos/registrar-imagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, imagemUrl: item.url, peso: 10 }),
        credentials: 'include',
      }).catch(() => {});
    }
    aoEscolher(item.url);
    aoFechar();
  };

  // Upload da foto do user → vai pro PromoPage backend, registra como "popular"
  // com peso máximo (20) — próximas buscas pelo mesmo nome priorizam essa foto.
  const aoSelecionarArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo 10MB.`);
      if (inputFileRef.current) inputFileRef.current.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert(`Arquivo não é uma imagem (tipo: ${file.type || 'desconhecido'}).`);
      if (inputFileRef.current) inputFileRef.current.value = '';
      return;
    }
    setEnviandoUpload(true);
    try {
      const fd = new FormData();
      fd.append('imagem', file);
      const r = await fetch(`${API_PROMOPAGE}/api/upload`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!r.ok) {
        let detalhe = '';
        try {
          const txt = await r.text();
          if (txt) {
            try { detalhe = JSON.parse(txt).error || txt.slice(0, 200); }
            catch { detalhe = txt.slice(0, 200); }
          }
        } catch {}
        throw new Error(`HTTP ${r.status}${detalhe ? ' — ' + detalhe : ''}`);
      }
      const json = await r.json();
      const url = json.url;
      // Registra como popular (peso 20 = sinal mais forte)
      const nome = (queryInicial || query || '').trim();
      if (nome && url) {
        await fetch(`${API_PROMOPAGE}/api/produtos/registrar-imagem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, imagemUrl: url, peso: 20 }),
          credentials: 'include',
        }).catch(() => null);
      }
      aoEscolher(url);
      aoFechar();
    } catch (err) {
      alert('Erro ao subir imagem: ' + (err.message || err));
    } finally {
      setEnviandoUpload(false);
      if (inputFileRef.current) inputFileRef.current.value = '';
    }
  };

  if (!aberto) return null;

  // PORTAL: renderiza no document.body em vez de dentro do componente pai.
  // Antes, o ModalEditarProdutos abrigava esse modal DENTRO de si — fazendo
  // o overlay herdar o width limitado do modal pai (visual quebrado: modal
  // pequeno em vez de 1200px). Portal escapa do DOM do pai.
  return createPortal(
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal escolher-imagem" onClick={e => e.stopPropagation()}>
        <button className="btn-fechar-x" onClick={aoFechar} aria-label="Fechar">✕</button>

        <h2 style={{ margin: '0 0 16px', fontSize: 22 }}>
          Produto: <b>{queryInicial}</b>
        </h2>

        <div className="busca-imagens">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (buscarPopulares(query), buscar(query))}
            placeholder="Refine a busca..."
          />
          <button onClick={() => { buscarPopulares(query); buscar(query); }} disabled={carregando}>
            {carregando ? 'Buscando...' : 'Pesquisar'}
          </button>
          <button
            onClick={() => inputFileRef.current?.click()}
            disabled={enviandoUpload}
            style={{ background: '#16a34a', color: '#fff', whiteSpace: 'nowrap' }}
            title="Suba a foto correta do seu PC. Será salva e priorizada nas próximas buscas."
          >
            {enviandoUpload ? 'Enviando...' : '📤 Subir foto minha'}
          </button>
          <input
            ref={inputFileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={aoSelecionarArquivo}
          />
        </div>

        {/* Status sóbrio — só conta total (igual PromoPage, sem diferenciar suas/internet) */}
        <div style={{ fontSize: 13, color: '#94a3b8', margin: '14px 0 8px' }}>
          {carregando
            ? '🔎 Buscando imagens...'
            : `${listaCombinada.length} imagem${listaCombinada.length === 1 ? '' : 'ns'} encontrada${listaCombinada.length === 1 ? '' : 's'}`}
        </div>

        <div className="grid-imagens">
          {listaCombinada.map((img, i) => {
            // BUG-FIX: populares vêm com URL RELATIVA (/uploads/3/file.jpg)
            // do backend do PromoPage. Sem prefixar API_PROMOPAGE, o browser
            // tenta carregar de videos.promopage.com.br (não existe) → 404.
            // Imagens da internet vão via proxy (CORS + redimensionamento).
            const srcPopular = img.url?.startsWith('http')
              ? img.url
              : `${API_PROMOPAGE}${img.url}`;
            const srcInternet = `${API_PROMOPAGE}/api/proxy-imagem-direto?url=${encodeURIComponent(img.url)}`;
            return (
              <div
                key={`img-${i}`}
                className={`img-card ${selecionada === i ? 'selecionada' : ''}`}
                onClick={() => selecionar(i)}
                title={img.titulo}
              >
                <img
                  src={img.isPopular ? srcPopular : srcInternet}
                  alt={img.titulo}
                  onError={(e) => { e.target.parentElement.style.opacity = 0.3; }}
                />
                {selecionada === i && (
                  <button className="btn-criar" onClick={(e) => { e.stopPropagation(); confirmarEscolha(); }}>
                    ✓ USAR
                  </button>
                )}
              </div>
            );
          })}
          {!carregando && listaCombinada.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#94a3b8' }}>
              Nenhuma imagem encontrada. Tente refinar a busca.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
