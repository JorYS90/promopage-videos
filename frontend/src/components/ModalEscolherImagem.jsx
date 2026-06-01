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

  const confirmarEscolha = () => {
    if (selecionada === null) return;
    const item = listaCombinada[selecionada];
    if (!item) return;
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

  return (
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

        {/* Status com info rica: quantos populares + status da busca internet.
            Populares aparecem INSTANTANEAMENTE (do banco interno).
            Internet demora 3-8s — mostramos progresso pro user não achar travado. */}
        <div style={{ fontSize: 13, color: '#94a3b8', margin: '14px 0 8px', display: 'flex', gap: 12, alignItems: 'center' }}>
          {populares.length > 0 && (
            <span style={{ color: '#22d3ee' }}>
              ✓ {populares.length} foto{populares.length === 1 ? '' : 's'} sua{populares.length === 1 ? '' : 's'}
            </span>
          )}
          {carregando ? (
            <span>🔎 Buscando até 24 imagens da internet... (~5s)</span>
          ) : (
            <span>+ {imagens.length} da internet · <b>{listaCombinada.length}</b> total no grid</span>
          )}
        </div>

        <div className="grid-imagens">
          {listaCombinada.map((img, i) => (
            <div
              key={`img-${i}`}
              className={`img-card ${selecionada === i ? 'selecionada' : ''} ${img.isPopular ? 'img-popular' : ''}`}
              onClick={() => selecionar(i)}
              title={img.titulo}
            >
              <img
                src={img.isPopular ? img.url : `${API_PROMOPAGE}/api/proxy-imagem-direto?url=${encodeURIComponent(img.url)}`}
                alt={img.titulo}
                onError={(e) => { e.target.parentElement.style.opacity = 0.3; }}
              />
              {/* Badge "✓ Sua foto" — sinaliza que essa imagem é prioridade
                  (user subiu OU já usou antes). Reforça hierarquia visual. */}
              {img.isPopular && (
                <span className="badge-popular" title="Foto que você ou outro user da plataforma já usou antes">
                  ✓ Sua foto
                </span>
              )}
              {selecionada === i && (
                <button className="btn-criar" onClick={(e) => { e.stopPropagation(); confirmarEscolha(); }}>
                  ✓ USAR
                </button>
              )}
            </div>
          ))}
          {!carregando && listaCombinada.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#94a3b8' }}>
              Nenhuma imagem encontrada. Tente refinar a busca.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
