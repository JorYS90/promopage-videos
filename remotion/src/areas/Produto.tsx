import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Theme } from '../lib/themes';
import type { Empresa, Formato, Produto as ProdutoT, Tema } from '../lib/types';
import { areaUtil } from '../lib/formato';
import { overrideRect } from '../lib/layout';
import { animaCamada, entrada, kenBurns, pop, pulsoPreco } from '../lib/anim';
import { ff } from '../lib/fonts';
import { measureText } from '@remotion/layout-utils';
import { AutoText } from './AutoText';
import { Logo } from './Logo';

type Variante = 'classico' | 'destaque-foto' | 'split';

interface Rect { x: number; y: number; w: number; h: number; }

function fotoRatio(variante: Variante): number {
  if (variante === 'destaque-foto') return 0.55;
  if (variante === 'split') return 0.44;
  return 0.48;
}

// Divide a área útil nas sub-áreas do produto conforme o formato.
function regioes(formato: Formato, variante: Variante, a: Rect) {
  const gap = a.h * 0.025;
  if (formato === 'horizontal') {
    const fw = a.w * 0.46;
    const rx = a.x + a.w * 0.5;
    const rw = a.w * 0.5;
    return {
      foto: { x: a.x, y: a.y, w: fw, h: a.h } as Rect,
      nome: { x: rx, y: a.y, w: rw, h: a.h * 0.26 } as Rect,
      preco: { x: rx, y: a.y + a.h * 0.28, w: rw, h: a.h * 0.5 } as Rect,
      info: { x: rx, y: a.y + a.h * 0.82, w: rw, h: a.h * 0.16 } as Rect,
    };
  }
  // vertical / quadrado — empilhado
  const fh = a.h * fotoRatio(variante);
  const nomeH = a.h * 0.14;
  const precoH = a.h * 0.26;
  const infoH = a.h * 0.08;
  let y = a.y;
  const foto: Rect = { x: a.x, y, w: a.w, h: fh }; y += fh + gap;
  const nome: Rect = { x: a.x, y, w: a.w, h: nomeH }; y += nomeH + gap;
  const preco: Rect = { x: a.x, y, w: a.w, h: precoH }; y += precoH + gap;
  const info: Rect = { x: a.x, y, w: a.w, h: infoH };
  return { foto, nome, preco, info };
}

function partesPreco(preco: string): { reais: string; centavos: string } {
  const limpo = String(preco).replace(/r\$\s*/i, '').trim();
  const [reais, centavos] = limpo.split(/[.,]/);
  return { reais: reais || limpo, centavos: centavos ? centavos.padEnd(2, '0').slice(0, 2) : '' };
}

const PilulaPreco: React.FC<{ produto: ProdutoT; theme: Tema; rect: Rect; escala: number; strike?: number; anim?: { transform?: string; opacity?: number } }> = ({
  produto,
  theme,
  rect,
  escala,
  strike = 1,
  anim,
}) => {
  const { reais, centavos } = partesPreco(produto.preco);
  // Transparente: preço SÓ texto (sem balão e sem pílula) — pra temas cujo fundo
  // já tem o painel do preço (ex.: Fecha Mês). Ignora o balão.
  const transp = !!theme.precoTransparente;
  const balao = transp ? null : theme.balaoPreco;
  // Altura de referência do número. No balão, autoajusta pra caber na LARGURA da
  // área branca interna; no transparente, na largura da caixa (nunca estoura).
  // Preço GIGANTE no modo transparente: usa a ALTURA toda da caixa (95%) e
  // NÃO encolhe pela largura — se o texto for mais largo que o rect, ele
  // simplesmente "sobra" pros lados (centralizado). Assim o "167" vira o
  // protagonista da cena. O usuário pode ajustar o rect/posição se a sobra
  // estiver indo pra fora da tela.
  const big0 = balao ? rect.h * 0.5 : (transp ? rect.h * 0.95 : rect.h * 0.62);
  let big = big0;
  // autofit de largura SÓ no modo balão (pra encaixar na área branca interna).
  // No transparente, deixa o texto ocupar o que precisar.
  const areaW = balao && theme.balaoTextoArea ? rect.w * 0.92 * theme.balaoTextoArea.w : null;
  if (areaW) {
    try {
      const fam = ff(theme.fontPreco);
      const lW = (txt: string, fs: number) => measureText({ text: txt, fontSize: fs, fontFamily: fam }).width;
      const larg = lW('R$', big0 * 0.32) + lW(reais, big0)
        + (centavos ? lW(`,${centavos}`, big0 * 0.5) : 0)
        + (produto.unidade ? lW(`/${produto.unidade}`, big0 * 0.26) : 0)
        + big0 * 0.18;
      if (larg > areaW) big = ((big0 * areaW) / larg) * 0.96;
    } catch { /* mantém big0 */ }
  }

  // Layout EMPILHADO (preço transparente): R$ pequeno à esquerda, REAIS gigante,
  // e (centavos / unidade) numa COLUNA pequena à direita. Usa menos largura, então
  // o "167" pode ficar maior dentro da caixa.
  const valor = transp ? (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: big * 0.04, fontFamily: ff(theme.fontPreco), color: theme.textoPreco, lineHeight: 1 }}>
      <span style={{ fontSize: big * 0.35, marginTop: big * 0.08 }}>R$</span>
      <span style={{ fontSize: big, lineHeight: 0.95 }}>{reais}</span>
      {(centavos || produto.unidade) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: big * 0.05, lineHeight: 1.05 }}>
          {centavos && <span style={{ fontSize: big * 0.42 }}>,{centavos}</span>}
          {produto.unidade && <span style={{ fontSize: big * 0.30, opacity: 0.95 }}>/{produto.unidade}</span>}
        </div>
      )}
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: big * 0.06, fontFamily: ff(theme.fontPreco), color: theme.textoPreco, lineHeight: 1 }}>
      <span style={{ fontSize: big * 0.32, alignSelf: 'flex-start', marginTop: big * 0.12 }}>R$</span>
      <span style={{ fontSize: big }}>{reais}</span>
      {centavos && <span style={{ fontSize: big * 0.5 }}>,{centavos}</span>}
      {produto.unidade && (
        <span style={{ fontSize: big * 0.26, alignSelf: 'flex-end', marginBottom: big * 0.12 }}>
          /{produto.unidade}
        </span>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${escala}) ${anim?.transform || ''}`,
        opacity: anim?.opacity,
      }}
    >
      {produto.precoDe && (
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            fontFamily: ff(theme.fontTexto),
            color: theme.textoSuave,
            fontSize: rect.h * 0.16,
            marginBottom: 2,
          }}
        >
          de R$ {produto.precoDe}
          {/* risco animado (desenha da esquerda pra direita) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '52%',
              height: Math.max(2, rect.h * 0.014),
              width: `${Math.round(strike * 100)}%`,
              background: theme.destaque,
              borderRadius: 2,
            }}
          />
        </div>
      )}
      {transp ? (
        // Sem fundo: só o texto do preço, com sombra/contorno pra destacar no fundo.
        <div style={{ textShadow: '0 3px 14px rgba(0,0,0,.55), 0 0 4px rgba(0,0,0,.45)' }}>{valor}</div>
      ) : balao ? (
        // Balão custom (PNG sem texto): o preço encaixa na área branca interna (detectada).
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Img src={balao} style={{ width: rect.w * 0.92, height: 'auto', objectFit: 'contain' }} />
          <div
            style={
              theme.balaoTextoArea
                ? { position: 'absolute', left: `${theme.balaoTextoArea.x * 100}%`, top: `${theme.balaoTextoArea.y * 100}%`, width: `${theme.balaoTextoArea.w * 100}%`, height: `${theme.balaoTextoArea.h * 100}%`, display: 'flex', alignItems: 'center', justifyContent: 'center' }
                : { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }
          >
            {valor}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: theme.pilulaPreco,
            borderRadius: rect.h * 0.22,
            padding: `${rect.h * 0.06}px ${rect.w * 0.06}px`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          {valor}
        </div>
      )}
    </div>
  );
};

export const Produto: React.FC<{
  produto: ProdutoT;
  theme: Theme;
  formato: Formato;
  variante: Variante;
  empresa?: Empresa;
}> = ({ produto, theme, formato, variante, empresa }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const au = areaUtil(formato);
  const a: Rect = { x: au.x, y: au.y, w: au.width, h: au.height };
  const auto = regioes(formato, variante, a);
  // Posição custom do tema (override) ou layout automático.
  const r = {
    foto: overrideRect(theme, formato, 'produtoFoto') ?? auto.foto,
    nome: overrideRect(theme, formato, 'produtoNome') ?? auto.nome,
    preco: overrideRect(theme, formato, 'produtoPreco') ?? auto.preco,
    info: overrideRect(theme, formato, 'produtoInfo') ?? auto.info,
    logo: overrideRect(theme, formato, 'produtoLogo'), // só renderiza se posicionado
  };

  const eFoto = entrada(frame, fps, theme.estilo, 0);
  const eNome = entrada(frame, fps, theme.estilo, 4);
  const popPreco = pop(frame, fps, theme.estilo, 8); // preço "estampa" com overshoot
  const pulso = pulsoPreco(frame, fps, theme.estilo);
  const strike = interpolate(frame, [16, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* AREA_PRODUTO — imagem */}
      <div
        style={{
          position: 'absolute',
          left: r.foto.x,
          top: r.foto.y,
          width: r.foto.w,
          height: r.foto.h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...eFoto,
        }}
      >
        {produto.imagem ? (
          <Img
            src={produto.imagem}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.4))',
              transform: kenBurns(frame, durationInFrames, theme.estilo),
            }}
          />
        ) : (
          <div
            style={{
              width: '70%',
              height: '70%',
              borderRadius: 24,
              border: `3px dashed ${theme.destaque}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.textoSuave,
              fontFamily: ff(theme.fontTexto),
              fontSize: r.foto.h * 0.08,
            }}
          >
            sem imagem
          </div>
        )}
      </div>

      {/* AREA_NOME */}
      <div style={{ position: 'absolute', left: r.nome.x, top: r.nome.y, ...eNome }}>
        <AutoText
          text={produto.nome}
          width={r.nome.w}
          height={r.nome.h}
          fontFamily={ff(theme.fontTitulo)}
          color={theme.textoForte}
          maxFontSize={Math.round(r.nome.h * 0.95)}
          maxLines={1}
          textTransform="uppercase"
          textShadow="0 3px 12px rgba(0,0,0,0.35)"
        />
      </div>

      {/* AREA_PRECO — estampa com overshoot + risco animado no "de" + movimento do balão */}
      <div style={{ opacity: popPreco.opacity }}>
        <PilulaPreco
          produto={produto}
          theme={theme}
          rect={r.preco}
          escala={popPreco.scale * pulso}
          strike={strike}
          anim={animaCamada((theme as Tema).precoAnim || 'flutuar', frame, fps, 'cima')}
        />
      </div>

      {/* LOGO na cena de produto (só quando o tema define a posição) */}
      {r.logo && empresa && (
        <div style={{ position: 'absolute', left: r.logo.x, top: r.logo.y, width: r.logo.w, height: r.logo.h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Logo empresa={empresa} theme={theme} altura={r.logo.h} box={{ w: r.logo.w, h: r.logo.h }} />
        </div>
      )}

      {/* AREA_INFO_EXTRA */}
      {produto.info && (
        <div style={{ position: 'absolute', left: r.info.x, top: r.info.y }}>
          <AutoText
            text={produto.info}
            width={r.info.w}
            height={r.info.h}
            fontFamily={ff(theme.fontTexto)}
            color={theme.textoSuave}
            maxFontSize={Math.round(r.info.h * 0.6)}
            maxLines={1}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
