import { useEffect, useRef, useState } from 'react';
import { uploadImagem } from '../api.js';
import { removerFundo as processarFundo } from '../remover-fundo.js';

// Abre após o upload da logo: recortar (arrastar cantos) + remover fundo (IA).
// Réplica do fluxo do PromoPage. aoSalvar(urlFinal) retorna a URL processada.
function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
async function uploadBlob(blob, nome) {
  const file = new File([blob], nome, { type: 'image/png' });
  const { url } = await uploadImagem(file, 'logo');
  return url;
}

export default function ModalRecortarLogo({ urlOriginal, aoFechar, aoSalvar }) {
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [removerFundo, setRemoverFundo] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = urlOriginal;
  }, [urlOriginal]);

  const obterRetImg = () => containerRef.current?.querySelector('.mrl-img-wrap')?.getBoundingClientRect();

  const aoMouseDown = (e, tipo) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = obterRetImg();
    if (!rect) return;
    dragRef.current = { tipo, startCrop: { ...crop }, startMouse: { x: e.clientX, y: e.clientY }, rect };
    window.addEventListener('mousemove', aoMouseMove);
    window.addEventListener('mouseup', aoMouseUp);
  };
  const aoMouseMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startMouse.x) / d.rect.width;
    const dy = (e.clientY - d.startMouse.y) / d.rect.height;
    const min = 0.05;
    const s = d.startCrop;
    const novo = { ...s };
    if (d.tipo === 'mover') {
      novo.x = Math.max(0, Math.min(1 - s.w, s.x + dx));
      novo.y = Math.max(0, Math.min(1 - s.h, s.y + dy));
    } else if (d.tipo === 'tl') {
      const nx = Math.max(0, Math.min(s.x + s.w - min, s.x + dx));
      const ny = Math.max(0, Math.min(s.y + s.h - min, s.y + dy));
      novo.w = s.x + s.w - nx; novo.h = s.y + s.h - ny; novo.x = nx; novo.y = ny;
    } else if (d.tipo === 'tr') {
      const ny = Math.max(0, Math.min(s.y + s.h - min, s.y + dy));
      novo.y = ny; novo.h = s.y + s.h - ny; novo.w = Math.max(min, Math.min(1 - s.x, s.w + dx));
    } else if (d.tipo === 'bl') {
      const nx = Math.max(0, Math.min(s.x + s.w - min, s.x + dx));
      novo.x = nx; novo.w = s.x + s.w - nx; novo.h = Math.max(min, Math.min(1 - s.y, s.h + dy));
    } else if (d.tipo === 'br') {
      novo.w = Math.max(min, Math.min(1 - s.x, s.w + dx));
      novo.h = Math.max(min, Math.min(1 - s.y, s.h + dy));
    }
    setCrop(novo);
  };
  const aoMouseUp = () => {
    dragRef.current = null;
    window.removeEventListener('mousemove', aoMouseMove);
    window.removeEventListener('mouseup', aoMouseUp);
  };

  const cropAlterado = !(crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1);

  const confirmar = async () => {
    if (processando) return;
    setProcessando(true);
    setProgresso('preparando…');
    try {
      let urlAtual = urlOriginal;
      if (cropAlterado) {
        setProgresso('recortando…');
        const img = await carregarImagem(urlOriginal);
        const cw = Math.round(img.naturalWidth * crop.w);
        const ch = Math.round(img.naturalHeight * crop.h);
        const cx = Math.round(img.naturalWidth * crop.x);
        const cy = Math.round(img.naturalHeight * crop.y);
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        canvas.getContext('2d').drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
        const blobCrop = await new Promise((r) => canvas.toBlob(r, 'image/png', 1));
        urlAtual = await uploadBlob(blobCrop, 'logo-recortada.png');
      }
      if (removerFundo) {
        setProgresso('removendo fundo… (rápido se o fundo for liso)');
        const blob = await processarFundo(urlAtual, { modeloIA: 'precise' });
        if (blob) urlAtual = await uploadBlob(blob, 'logo-sem-fundo.png');
      }
      aoSalvar(urlAtual);
      aoFechar();
    } catch (e) {
      alert('Erro ao processar: ' + (e?.message || 'desconhecido'));
    } finally {
      setProcessando(false);
      setProgresso('');
    }
  };

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="mrl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mrl-titulo">Ajuste sua logo</div>
        <div className="mrl-area" ref={containerRef}>
          <div className="mrl-img-wrap" style={imgSize.w && imgSize.h ? { aspectRatio: `${imgSize.w} / ${imgSize.h}` } : undefined}>
            <img className="mrl-img" src={urlOriginal} alt="Logo" draggable={false} />
            <div
              className="mrl-crop"
              style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }}
              onMouseDown={(e) => aoMouseDown(e, 'mover')}
            >
              <span className="mrl-handle tl" onMouseDown={(e) => aoMouseDown(e, 'tl')} />
              <span className="mrl-handle tr" onMouseDown={(e) => aoMouseDown(e, 'tr')} />
              <span className="mrl-handle bl" onMouseDown={(e) => aoMouseDown(e, 'bl')} />
              <span className="mrl-handle br" onMouseDown={(e) => aoMouseDown(e, 'br')} />
            </div>
          </div>
        </div>

        <div className="mrl-toolbar">
          <label className="mrl-checkbox">
            <input type="checkbox" checked={removerFundo} onChange={(e) => setRemoverFundo(e.target.checked)} />
            <span>Remover fundo da imagem (IA)</span>
          </label>
          <div className="mrl-acoes">
            <button type="button" className="btn" onClick={aoFechar} disabled={processando}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={confirmar} disabled={processando}>
              {processando ? '⏳ Processando…' : '✓ Usar logo'}
            </button>
          </div>
        </div>
        {processando && <div className="mrl-progresso">{progresso}</div>}
      </div>
    </div>
  );
}
