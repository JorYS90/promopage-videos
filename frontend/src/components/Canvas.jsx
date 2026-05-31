import { useLayoutEffect, useRef, useState } from 'react';
import { ASPECTO } from '../themes.js';
import { overrideFrac, POS_CAMADA, DEFAULT_LAYOUT } from '../layout-padrao.js';

// Encaixe automático na prévia: escala o conteúdo pra caber na caixa (largura+altura),
// espelhando o autofit do render (AutoText). Usado nos elementos com posição custom.
function FitBox({ children }) {
  const boxRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const box = boxRef.current, inner = innerRef.current;
    if (!box || !inner) return;
    const medir = () => {
      inner.style.transform = 'none';
      // largura/altura NATURAIS do conteúdo (max-content), pra escalar e caber.
      const cw = inner.offsetWidth, ch = inner.offsetHeight;
      const bw = box.clientWidth, bh = box.clientHeight;
      if (cw && ch && bw && bh) {
        const s = Math.min(bw / cw, bh / ch, 1);
        setScale(s > 0 ? s : 1);
        inner.style.transform = `scale(${s})`;
      }
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(box);
    return () => ro.disconnect();
  });
  return (
    <div ref={boxRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div ref={innerRef} style={{ width: 'max-content', transform: `scale(${scale})`, transformOrigin: 'center' }}>{children}</div>
    </div>
  );
}

// Tamanhos em cqw (1cqw = 1% da largura do frame) → escalam junto com a prévia.
const cq = (n) => `${n}cqw`;

// Cor escura o bastante p/ aparecer no painel branco (luminância < 180).
const corEscura = (hex) => {
  if (!hex || hex[0] !== '#') return false;
  const h = hex.slice(1);
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 180;
};
const iconeNoBranco = (theme) =>
  [theme.destaque, theme.textoForte, theme.rodapeCor].find(corEscura) || '#1f2937';

// Estes elementos escalam pra caber na caixa (FitBox): textos + balão de preço.
// Logo/foto preenchem a caixa direto.
const FIT_TEXTO = new Set(['introTexto', 'produtoNome', 'produtoInfo', 'produtoPreco', 'ctaTexto', 'ctaPeriodo', 'finalTexto']);
const fmtData = (iso) => { if (!iso) return ''; const [, m, d] = iso.split('-'); return d && m ? `${d}/${m}` : ''; };
function periodoDeRegras(regras, fallback) {
  if (regras?.mostrarDatas && regras.dataInicio && regras.dataFinal) {
    return `Ofertas válidas de ${fmtData(regras.dataInicio)} a ${fmtData(regras.dataFinal)}`;
  }
  return fallback || '';
}

function ratio(formato) {
  if (formato === 'horizontal') return { w: 1920, h: 1080 };
  if (formato === 'quadrado') return { w: 1080, h: 1080 };
  return { w: 1080, h: 1920 };
}
function faseDe(cena) {
  if (cena === 'intro') return 'intro';
  if (cena === 'cta') return 'cta';
  if (cena === 'final') return 'ctaFim';
  return 'produtos';
}
// Background da fase, com fallback p/ outra fase do mesmo formato (se o admin
// enviou só um fundo, ele serve pras outras cenas também).
function bgDaFase(theme, formato, cena) {
  if (theme.tipo !== 'imagem' || !theme.backgrounds) return null;
  const fase = faseDe(cena);
  const daFase = (b) => (b ? (b[fase] || b.cta || b.ctaFim || b.produtos || b.intro) : null);
  // Tenta o formato pedido; senão reaproveita outro (horizontal de preferência),
  // com recorte central (cover) — Quadrado/Feed pode usar imagens do Horizontal.
  for (const f of [formato, 'horizontal', 'vertical', 'quadrado']) {
    const u = daFase(theme.backgrounds[f]);
    if (u) return u;
  }
  return null;
}
function partesPreco(preco) {
  const limpo = String(preco || '').replace(/r\$\s*/i, '').trim();
  const [reais, centavos] = limpo.split(/[.,]/);
  return { reais: reais || limpo || '0', centavos: centavos ? centavos.padEnd(2, '0').slice(0, 2) : '' };
}
const absStyle = (r) => ({
  position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`,
  width: `${r.w * 100}%`, height: `${r.h * 100}%`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
});

function Deco({ theme }) {
  return (
    <>
      <div className="preview-deco" style={{ top: '-12%', right: '-8%', width: '38%', paddingBottom: '38%', background: `${theme.destaque}1f` }} />
      <div className="preview-deco" style={{ bottom: '-14%', left: '-10%', width: '44%', paddingBottom: '44%', background: `${theme.destaque}14` }} />
    </>
  );
}
function Logo({ empresa, theme, fz, fill }) {
  if (empresa.logo) {
    const f = empresa.logoFundo || 'transparente';
    const dark = f.startsWith('escuro');
    const round = f.endsWith('redondo');
    if (f === 'transparente') {
      const st = fill
        ? { width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.35))' }
        : { height: cq(fz * 1.8), width: 'auto', display: 'block', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.35))' };
      return <img src={empresa.logo} alt="" style={st} />;
    }
    const base = { background: dark ? '#1f2937' : '#ffffff', boxShadow: '0 6px 18px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    if (round) {
      const dim = fill ? { height: '100%', aspectRatio: '1 / 1', maxWidth: '100%' } : { width: cq(fz * 2.6), height: cq(fz * 2.6) };
      return <div style={{ ...base, ...dim, borderRadius: '50%' }}><img src={empresa.logo} alt="" style={{ maxWidth: '74%', maxHeight: '74%', display: 'block' }} /></div>;
    }
    const wrap = fill ? { width: '100%', height: '100%', borderRadius: cq(2), padding: cq(2) } : { borderRadius: cq(fz * 0.45), padding: cq(fz * 0.4) };
    const img = fill ? { width: '100%', height: '100%', objectFit: 'contain', display: 'block' } : { height: cq(fz * 1.6), width: 'auto', display: 'block' };
    return <div style={{ ...base, ...wrap }}><img src={empresa.logo} alt="" style={img} /></div>;
  }
  return <div style={{
    background: theme.destaque, color: theme.textoPreco, borderRadius: cq(fz * 0.5),
    padding: `${cq(fz * 0.25)} ${cq(fz * 0.8)}`, fontFamily: 'Anton, sans-serif', fontSize: cq(fz * 1.1),
    textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: '0 6px 18px rgba(0,0,0,.25)',
  }}>{empresa.nome || 'Sua Logo'}</div>;
}
function IconePrev({ tipo, fz, color }) {
  const base = { width: cq(fz * 1.1), height: cq(fz * 1.1), flex: '0 0 auto' };
  const st = { ...base, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (tipo === 'local') return <svg viewBox="0 0 24 24" style={base} fill={color}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>;
  if (tipo === 'fone') return <svg viewBox="0 0 24 24" style={base} fill={color}><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.02l-2.21 2.21z" /></svg>;
  if (tipo === 'zap') return <svg viewBox="0 0 24 24" style={base} fill={color}><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.3 14.8l-.3-.2-2.6.7.7-2.5-.2-.3A8 8 0 0 1 12 4z" /></svg>;
  if (tipo === 'insta') return <svg viewBox="0 0 24 24" style={st}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.6" fill={color} /></svg>;
  if (tipo === 'relogio') return <svg viewBox="0 0 24 24" style={st}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
  return <svg viewBox="0 0 24 24" style={st}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></svg>;
}
function ContatoPrev({ empresa, theme, claro }) {
  const horarioTxt = [empresa.dias, empresa.horario].filter(Boolean).join(' · ');
  const linhas = [
    empresa.endereco && { tipo: 'local', txt: empresa.endereco },
    empresa.telefone && { tipo: 'fone', txt: empresa.telefone },
    empresa.whatsapp && { tipo: 'zap', txt: empresa.whatsapp },
    empresa.instagram && { tipo: 'insta', txt: empresa.instagram },
    empresa.site && { tipo: 'site', txt: empresa.site },
    horarioTxt && { tipo: 'relogio', txt: horarioTxt },
  ].filter(Boolean);
  if (!linhas.length) return null;
  const fz = 3;
  const iconeCor = claro ? iconeNoBranco(theme) : theme.destaque;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: `${cq(1)} ${cq(2.6)}`, maxWidth: cq(86), background: claro ? 'transparent' : 'rgba(0,0,0,.34)', borderRadius: cq(1.6), padding: claro ? 0 : `${cq(2)} ${cq(2.8)}`, boxShadow: claro ? 'none' : '0 8px 22px rgba(0,0,0,.3)' }}>
      {linhas.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: cq(fz * 0.45), color: claro ? '#1f2937' : theme.textoForte, fontSize: cq(fz), fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1.1, fontWeight: claro ? 600 : 400 }}>
          <IconePrev tipo={l.tipo} fz={fz} color={iconeCor} />
          <span>{l.txt}</span>
        </div>
      ))}
    </div>
  );
}
const animCss = (anim) => {
  if (anim === 'parallax') return 'prevParallax 6s ease-in-out infinite';
  if (anim === 'nenhum' || anim === 'deslizar') return 'none';
  return 'prevFloat 3.2s ease-in-out infinite';
};
function CamadasPrev({ tema, formato }) {
  const c = tema?.camadas?.[formato];
  if (!c) return null;
  const pos = POS_CAMADA[formato] || POS_CAMADA.horizontal;
  const ovId = { esq: 'camadaEsq', dir: 'camadaDir' };
  const item = (slot, sombra) => {
    const cam = c[slot];
    if (!cam?.img) return null;
    const r = (ovId[slot] && overrideFrac(tema, formato, ovId[slot])) || pos[slot];
    return (
      <div style={{ position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%`, animation: animCss(cam.anim), zIndex: 2 }}>
        <img src={cam.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: sombra ? 'drop-shadow(0 8px 18px rgba(0,0,0,.35))' : undefined }} />
      </div>
    );
  };
  return <>{item('icones', false)}{item('esq', true)}{item('dir', true)}</>;
}
function corContraste(bg) {
  const h = (bg || '').replace('#', '');
  if (h.length < 6) return '#ffffff';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#1f2937' : '#ffffff';
}
function RodapePrev({ regras, empresa, theme, formato }) {
  const k = formato === 'horizontal' ? 1 : 2.1; // vertical/quadrado: rodapé maior
  const fmt = (iso) => { if (!iso) return ''; const [, m, d] = iso.split('-'); return d && m ? `${d}/${m}` : ''; };
  const itens = [];
  if (regras?.mostrarDatas && regras.dataInicio && regras.dataFinal) itens.push(`Válido de ${fmt(regras.dataInicio)} a ${fmt(regras.dataFinal)}`);
  if (regras?.enquantoEstoque) itens.push('Enquanto durarem os estoques');
  if (regras?.imagensIlustrativas) itens.push('Imagens meramente ilustrativas');
  if (regras?.advertenciaMedicamento) itens.push('Se persistirem os sintomas, o médico deverá ser consultado');
  if (empresa?.endereco) itens.push(empresa.endereco);
  if (!itens.length) return null;
  const cor = theme.rodapeCor || theme.destaque || '#1e3a8a';
  const txt = corContraste(cor);
  const filetCor = theme.rodapeFiletCor || theme.fundo || '#ffffff';
  const nodes = [];
  itens.forEach((t, i) => {
    if (i > 0) nodes.push(<span key={`d${i}`} style={{ opacity: 0.45 }}>|</span>);
    nodes.push(<span key={`t${i}`}>{t}</span>);
  });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6 }}>
      <div style={{ height: cq(0.7 * k), background: filetCor }} />
      <div style={{ background: cor, color: txt, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: `${cq(0.5 * k)} ${cq(1.4 * k)}`, padding: `${cq(1.2 * k)} ${cq(2 * k)}`, fontFamily: 'Barlow Condensed, sans-serif', fontSize: cq(2.4 * k), fontWeight: 600, lineHeight: 1.1 }}>
        {nodes}
      </div>
    </div>
  );
}
function SeloPrev({ empresa, theme }) {
  const alt = 5;
  return (
    <div style={{ position: 'absolute', top: cq(4), right: cq(4), opacity: 0.9, display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 5 }}>
      {empresa.logo
        ? <img src={empresa.logo} alt="" style={{ height: cq(alt), width: 'auto', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.5))' }} />
        : <div style={{ height: cq(alt), display: 'flex', alignItems: 'center', padding: `0 ${cq(alt * 0.42)}`, background: `${theme.destaque}cc`, color: theme.textoPreco, borderRadius: cq(alt * 0.28), fontFamily: 'Anton, sans-serif', fontSize: cq(alt * 0.5), textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{empresa.nome || 'Sua Logo'}</div>}
    </div>
  );
}
function Valor({ produto, theme, base }) {
  const { reais, centavos } = partesPreco(produto.preco);
  if (theme.precoTransparente) {
    // Layout EMPILHADO (igual o render): cents/unit em coluna à direita
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: cq(base * 0.05), fontFamily: 'Anton, sans-serif', color: theme.textoPreco, lineHeight: 1 }}>
        <span style={{ fontSize: cq(base * 0.55), marginTop: cq(base * 0.12) }}>R$</span>
        <span style={{ fontSize: cq(base * 1.5), lineHeight: 0.95 }}>{reais}</span>
        {(centavos || produto.unidade) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: cq(base * 0.08), lineHeight: 1.05 }}>
            {centavos && <span style={{ fontSize: cq(base * 0.65) }}>,{centavos}</span>}
            {produto.unidade && <span style={{ fontSize: cq(base * 0.45), opacity: .95 }}>/{produto.unidade}</span>}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: cq(base * 0.06), fontFamily: 'Anton, sans-serif', color: theme.textoPreco, lineHeight: 1 }}>
      <span style={{ fontSize: cq(base * 0.5), alignSelf: 'flex-start' }}>R$</span>
      <span style={{ fontSize: cq(base * 1.5) }}>{reais}</span>
      {centavos && <span style={{ fontSize: cq(base * 0.8) }}>,{centavos}</span>}
      {produto.unidade && <span style={{ fontSize: cq(base * 0.42), alignSelf: 'flex-end' }}>/{produto.unidade}</span>}
    </div>
  );
}
function PrecoPill({ produto, theme, base, rectH = 0.17 }) {
  // No modo transparente, o preço usa cqh proporcional ao rect (igual o render).
  // big = 95% da altura do rect (em % da altura da prévia) = rectH * 95 cqh.
  if (theme.precoTransparente) {
    const { reais, centavos } = partesPreco(produto.preco);
    const big = rectH * 95; // valor em cqh (% altura da prévia-frame)
    const f = (mult) => `${(big * mult).toFixed(2)}cqh`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {produto.precoDe && <div style={{ color: theme.textoSuave, fontSize: cq(base * 0.5), textDecoration: 'line-through', fontFamily: 'Barlow Condensed, sans-serif' }}>de R$ {produto.precoDe}</div>}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: f(0.04), fontFamily: 'Anton, sans-serif', color: theme.textoPreco, lineHeight: 1, textShadow: '0 3px 12px rgba(0,0,0,.55), 0 0 3px rgba(0,0,0,.45)' }}>
          <span style={{ fontSize: f(0.35), marginTop: f(0.08) }}>R$</span>
          <span style={{ fontSize: f(1), lineHeight: 0.95 }}>{reais}</span>
          {(centavos || produto.unidade) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: f(0.05), lineHeight: 1.05 }}>
              {centavos && <span style={{ fontSize: f(0.42) }}>,{centavos}</span>}
              {produto.unidade && <span style={{ fontSize: f(0.30), opacity: .95 }}>/{produto.unidade}</span>}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {produto.precoDe && <div style={{ color: theme.textoSuave, fontSize: cq(base * 0.5), textDecoration: 'line-through', fontFamily: 'Barlow Condensed, sans-serif' }}>de R$ {produto.precoDe}</div>}
      {theme.balaoPreco ? (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: cq(58) }}>
          <img src={theme.balaoPreco} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
          <div style={theme.balaoTextoArea
            ? { position: 'absolute', left: `${theme.balaoTextoArea.x * 100}%`, top: `${theme.balaoTextoArea.y * 100}%`, width: `${theme.balaoTextoArea.w * 100}%`, height: `${theme.balaoTextoArea.h * 100}%`, display: 'flex', alignItems: 'center', justifyContent: 'center' }
            : { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Valor produto={produto} theme={theme} base={base * 1.1} /></div>
        </div>
      ) : (
        <div style={{ background: theme.pilulaPreco, borderRadius: cq(base * 0.45), padding: `${cq(base * 0.15)} ${cq(base * 0.5)}`, boxShadow: '0 8px 22px rgba(0,0,0,.3)' }}>
          <Valor produto={produto} theme={theme} base={base} />
        </div>
      )}
    </div>
  );
}

function CenaConteudo({ cena, theme, empresa, produtos, textos, regras, formato }) {
  const periodoTxt = periodoDeRegras(regras, textos.periodo);
  const ov = (id) => overrideFrac(theme, formato, id);
  const stackBase = { position: 'absolute', inset: '8% 6%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: cq(3.5), textAlign: 'center' };

  // Define os elementos da cena e renderiza cada um no stack (sem override) ou absoluto (com override).
  const montar = (els, fotoFlex = null) => {
    const stack = els.filter((e) => e.node && !ov(e.id));
    const abs = els.filter((e) => e.node && ov(e.id));
    return (
      <>
        <div style={stackBase}>
          {stack.map((e) => (
            <div key={e.id} style={e.id === fotoFlex ? { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 } : undefined}>{e.node}</div>
          ))}
        </div>
        {abs.map((e) => {
          // No modo "preço transparente", o preço usa a ALTURA toda da caixa e
          // pode "sobrar" pros lados — então NÃO passa pelo FitBox (que encolheria).
          const usaFit = FIT_TEXTO.has(e.id) && !(e.id === 'produtoPreco' && theme.precoTransparente);
          return <div key={e.id} style={absStyle(ov(e.id))}>{usaFit ? <FitBox>{e.node}</FitBox> : e.node}</div>;
        })}
      </>
    );
  };

  if (cena === 'intro') {
    return montar([
      { id: 'introLogo', node: <Logo empresa={empresa} theme={theme} fz={5} fill={!!ov('introLogo')} /> },
      { id: 'introTexto', node: (
        <div style={{ textAlign: 'center' }}>
          {!ov('introTexto') && <div style={{ color: theme.destaque, fontSize: cq(3.5), letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif' }}>Ofertas</div>}
          <div style={{ color: theme.introTextoCor || theme.textoForte, fontSize: cq(9), fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', lineHeight: 1.02, textShadow: '0 4px 14px rgba(0,0,0,.45)', whiteSpace: ov('introTexto') ? 'nowrap' : 'normal' }}>{textos.introTexto || 'Ofertas da semana'}</div>
        </div>
      ) },
    ]);
  }
  if (cena === 'cta') {
    return montar([
      { id: 'ctaTexto', node: <div style={{ color: theme.textoForte, fontSize: cq(9), fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.05, textShadow: '0 4px 14px rgba(0,0,0,.45)', whiteSpace: 'nowrap' }}>{textos.cta || 'Corre aproveitar!'}</div> },
      { id: 'ctaPeriodo', node: periodoTxt ? <div style={{ color: theme.textoForte, fontSize: cq(4), textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,.45)', whiteSpace: 'nowrap' }}>{periodoTxt}</div> : null },
    ]);
  }
  if (cena === 'final') {
    return montar([
      { id: 'finalLogo', node: <Logo empresa={empresa} theme={theme} fz={6} fill={!!ov('finalLogo')} /> },
      { id: 'finalTexto', node: <div style={{ color: theme.textoForte, fontSize: cq(8), fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', lineHeight: 1.05, textAlign: 'center', whiteSpace: 'nowrap', textShadow: '0 4px 14px rgba(0,0,0,.45)' }}>{textos.finalTexto || 'Venha conferir nossa loja'}</div> },
      { id: 'finalContato', node: <ContatoPrev empresa={empresa} theme={theme} claro={!!ov('finalContato')} /> },
    ]);
  }
  // produto-i
  const i = parseInt(cena.split('-')[1], 10);
  const p = produtos[i] || {};
  const foto = p.imagem
    ? <img src={p.imagem} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 26px rgba(0,0,0,.4))' }} />
    : <div style={{ width: '70%', height: '78%', border: `2px dashed ${theme.destaque}66`, borderRadius: cq(3), display: 'grid', placeItems: 'center', color: theme.textoSuave, fontSize: cq(3), fontFamily: 'Barlow Condensed, sans-serif' }}>sem imagem</div>;
  return montar([
    { id: 'produtoFoto', node: foto },
    { id: 'produtoNome', node: <div style={{ color: theme.textoForte, fontSize: cq(7), fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', lineHeight: 1, textAlign: 'center', textShadow: '0 3px 10px rgba(0,0,0,.45)' }}>{p.nome || `Produto ${i + 1}`}</div> },
    { id: 'produtoPreco', node: <PrecoPill produto={p} theme={theme} base={5} rectH={(ov('produtoPreco') || DEFAULT_LAYOUT.produtoPreco).h} /> },
    { id: 'produtoInfo', node: p.info ? <div style={{ color: theme.textoSuave, fontSize: cq(3), fontFamily: 'Barlow Condensed, sans-serif' }}>{p.info}</div> : null },
    ...(ov('produtoLogo') ? [{ id: 'produtoLogo', node: <Logo empresa={empresa} theme={theme} fz={5} fill /> }] : []),
  ], 'produtoFoto');
}

export default function Canvas({ formato, tema, empresa, produtos, textos, regras, cena, setCena, job, aoGerar, podeGerar, gerando }) {
  const r = ratio(formato);
  const portrait = (ASPECTO[formato] ?? 1) < 1;
  const theme = tema || {};
  const bgImg = bgDaFase(theme, formato, cena);
  // Tema por imagem mas NENHUM fundo (nem reaproveitando outro formato) → avisa.
  const semFundoNoFormato = theme.tipo === 'imagem' && !bgImg;

  const cenas = [
    { id: 'intro', label: 'Intro' },
    ...produtos.map((_, i) => ({ id: `produto-${i}`, label: `P${i + 1}` })),
    { id: 'cta', label: 'CTA' },
    { id: 'final', label: 'Fim' },
  ];

  if (job && job.status === 'done') {
    return (
      <div className="canvas-area">
        <video className="canvas-video" src={job.outputUrl} controls autoPlay loop />
        <div className="preview-legenda">Vídeo gerado · {formato} · {produtos.length} produtos</div>
        <a className="btn btn-primary btn-sm" href={job.outputUrl} download>Baixar vídeo</a>
      </div>
    );
  }
  if (job && (job.status === 'processing' || job.status === 'queued')) {
    return (
      <div className="canvas-area">
        <div className="canvas-progress">
          <div className="bar"><span style={{ width: `${job.progress || 0}%` }} /></div>
          <div className="txt">{job.status === 'queued' ? 'Na fila…' : `Renderizando… ${job.progress || 0}%`}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-area">
      <div
        className="preview-frame"
        style={{
          aspectRatio: `${r.w} / ${r.h}`,
          width: portrait ? 'auto' : '100%',
          height: portrait ? '70vh' : 'auto',
          maxWidth: '100%', maxHeight: '70vh', containerType: 'size',
          background: `radial-gradient(120% 120% at 50% 0%, ${theme.fundo || '#1e293b'}, ${theme.fundoAlt || '#0f172a'})`,
        }}
      >
        {bgImg
          ? <img src={bgImg} alt="" className={theme.efeitoLuzes ? 'bg-luzes' : undefined} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Deco theme={theme} />}
        {(cena === 'intro' || cena === 'cta') && <CamadasPrev tema={theme} formato={formato} />}
        <CenaConteudo cena={cena} theme={theme} empresa={empresa} produtos={produtos} textos={textos} regras={regras} formato={formato} />
        {cena.startsWith('produto') && <RodapePrev regras={regras} empresa={empresa} theme={theme} formato={formato} />}
      </div>
      <div className="preview-cena-tabs">
        {cenas.map((c) => (
          <button key={c.id} className={cena === c.id ? 'sel' : ''} onClick={() => setCena(c.id)}>{c.label}</button>
        ))}
      </div>
      {semFundoNoFormato && (
        <div className="preview-aviso">⚠ Este tema não tem fundo para o formato <b>{formato}</b>. Troque o formato ou envie os fundos desse formato no tema.</div>
      )}
      <div className="preview-legenda">Prévia aproximada — o vídeo final é animado e com autofit exato.</div>
      {aoGerar && (
        <button className="btn-gerar-preview" disabled={!podeGerar || gerando} onClick={aoGerar}>
          {gerando ? 'Gerando…' : '🎬 Gerar vídeo'}
        </button>
      )}
    </div>
  );
}
