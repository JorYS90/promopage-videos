import { useRef } from 'react';
import { FASES_LAYOUT, DEFAULT_LAYOUT, camadaDefault } from '../layout-padrao.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r3 = (v) => Math.round(v * 1000) / 1000;
const RATIO = { vertical: '9 / 16', horizontal: '16 / 9', quadrado: '1 / 1' };
// Texto de exemplo mostrado dentro de cada caixa (preview de como vai ficar).
const PREVIEW = {
  introTexto: 'Abertura', produtoNome: 'NOME DO PRODUTO', produtoPreco: 'R$ 9,99',
  produtoInfo: 'observação', ctaTexto: 'CTA', ctaPeriodo: 'validade', finalTexto: 'Encerramento',
};

// Editor visual: arraste pra mover, alça (canto) pra redimensionar. Cada elemento
// vira um override em fração do frame. Quem não for movido continua automático.
export default function PosicaoEditor({ formato, fase, background, logoUrl, layout, setLayout }) {
  const ehLogo = (id) => id === 'introLogo' || id === 'finalLogo';
  const frameRef = useRef(null);
  const dragRef = useRef(null);

  const faseInfo = FASES_LAYOUT.find((f) => f.id === fase);
  const elementos = faseInfo.elementos;
  const getRect = (id) => (layout?.[formato]?.[id])
    || ((id === 'camadaEsq' || id === 'camadaDir') ? camadaDefault(formato, id) : DEFAULT_LAYOUT[id]);
  const ehCustom = (id) => !!(layout?.[formato] && layout[formato][id]);

  const setRect = (id, rect) => {
    setLayout((prev) => ({ ...prev, [formato]: { ...(prev[formato] || {}), [id]: rect } }));
  };
  const resetRect = (id) => {
    setLayout((prev) => {
      const f = { ...(prev[formato] || {}) };
      delete f[id];
      return { ...prev, [formato]: f };
    });
  };

  const onMove = (e) => {
    const d = dragRef.current;
    if (!d || !frameRef.current) return;
    const fr = frameRef.current.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / fr.width;
    const dy = (e.clientY - d.startY) / fr.height;
    let { x, y, w, h } = d.startRect;
    const MIN_W = 0.05, MIN_H = 0.04;
    // Permite UltraPASSAR as bordas (elemento pode "sair" do frame) — útil pra
    // camadas decorativas que invadem a tela. Resize agora tem 4 alças (cantos).
    if (d.mode === 'move') {
      x = x + dx;
      y = y + dy;
    } else if (d.mode === 'br') {
      w = Math.max(MIN_W, w + dx);
      h = Math.max(MIN_H, h + dy);
    } else if (d.mode === 'tl') {
      const newW = Math.max(MIN_W, w - dx);
      const newH = Math.max(MIN_H, h - dy);
      x = x + (w - newW);
      y = y + (h - newH);
      w = newW; h = newH;
    } else if (d.mode === 'tr') {
      const newH = Math.max(MIN_H, h - dy);
      y = y + (h - newH);
      w = Math.max(MIN_W, w + dx);
      h = newH;
    } else if (d.mode === 'bl') {
      const newW = Math.max(MIN_W, w - dx);
      x = x + (w - newW);
      w = newW;
      h = Math.max(MIN_H, h + dy);
    }
    // limites técnicos amplos pra não explodir (mas permite ultrapassar a imagem)
    x = clamp(x, -1, 2); y = clamp(y, -1, 2); w = clamp(w, MIN_W, 3); h = clamp(h, MIN_H, 3);
    setRect(d.id, { x: r3(x), y: r3(y), w: r3(w), h: r3(h) });
  };
  const onUp = () => {
    dragRef.current = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  const onDown = (e, id, mode) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { id, mode, startX: e.clientX, startY: e.clientY, startRect: { ...getRect(id) } };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Dimensiona o frame na proporção EXATA do formato (igual ao vídeo), pra a
  // imagem aparecer inteira (sem corte) e as posições baterem com o render:
  // - horizontal: limita pela LARGURA (altura segue o aspect-ratio);
  // - vertical/quadrado: limita pela ALTURA (largura segue o aspect-ratio).
  const sizing = formato === 'horizontal'
    ? { width: '100%', maxWidth: 880 }
    : { height: 'min(80vh, 680px)', width: 'auto', maxWidth: '100%' };

  return (
    <div className="pos-editor-wrap">
      <div
        ref={frameRef}
        className="pos-editor"
        style={{ aspectRatio: RATIO[formato], ...sizing, backgroundImage: background ? `url(${background})` : undefined }}
      >
        {!background && <div className="pos-editor-vazio">Sem background neste formato/fase — envie em "Backgrounds"</div>}
        {elementos.map((el, i) => {
          const r = getRect(el.id);
          return (
            <div
              key={el.id}
              className={`pos-box ${ehCustom(el.id) ? 'custom' : 'auto'}`}
              style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%`, zIndex: 5 + i }}
              onMouseDown={(e) => onDown(e, el.id, 'move')}
            >
              {ehLogo(el.id) && logoUrl
                ? <img src={logoUrl} alt="" className="pos-box-logo" draggable={false} />
                : el.id === 'produtoFoto'
                  ? <span className="pos-box-foto">📦</span>
                  : <span className="pos-box-preview">{PREVIEW[el.id] || el.label}</span>}
              <span className="pos-box-tag">{el.label}{ehCustom(el.id) ? '' : ' · auto'}</span>
              <div className="pos-handle pos-handle-tl" onMouseDown={(e) => onDown(e, el.id, 'tl')} title="Redimensionar (canto superior-esquerdo)" />
              <div className="pos-handle pos-handle-tr" onMouseDown={(e) => onDown(e, el.id, 'tr')} title="Redimensionar (canto superior-direito)" />
              <div className="pos-handle pos-handle-bl" onMouseDown={(e) => onDown(e, el.id, 'bl')} title="Redimensionar (canto inferior-esquerdo)" />
              <div className="pos-handle pos-handle-br" onMouseDown={(e) => onDown(e, el.id, 'br')} title="Redimensionar (canto inferior-direito)" />
            </div>
          );
        })}
      </div>
      <div className="pos-legenda">
        {elementos.map((el) => (
          <span key={el.id} className="pos-chip">
            {el.label}
            {ehCustom(el.id) && <button className="pos-reset" title="Voltar pro automático" onClick={() => resetRect(el.id)}>↺</button>}
          </span>
        ))}
      </div>
    </div>
  );
}
