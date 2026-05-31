import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Formato, Tema } from '../lib/types';
import { Background } from './Background';

export type Fase = 'intro' | 'produtos' | 'cta' | 'ctaFim';

// Fundo da cena: usa o background do FORMATO + fase (imagem cover) quando o tema
// é por imagem; senão cai pro degradê gerado (Background). O background certo é
// puxado automaticamente conforme o formato escolhido (vertical/horizontal/quadrado).
// Melhor URL de fundo p/ a fase, dentro de um conjunto de backgrounds do formato.
type BgSet = { intro?: string; produtos?: string; cta?: string; ctaFim?: string } | undefined;
const daFase = (b: BgSet, fase: Fase) =>
  b ? (b[fase] || b.cta || b.ctaFim || b.produtos || b.intro) : undefined;

export const Fundo: React.FC<{ tema: Tema; fase: Fase; formato: Formato }> = ({ tema, fase, formato }) => {
  let url: string | undefined;
  if (tema.tipo === 'imagem' && tema.backgrounds) {
    // 1) Tenta o formato pedido. 2) Reaproveita outro formato (horizontal de
    //    preferência), com recorte central (cover) — assim o Quadrado/Feed pode
    //    usar as imagens do Horizontal sem precisar subir tudo de novo.
    const ordem: Formato[] = [formato, 'horizontal', 'vertical', 'quadrado'];
    for (const f of ordem) {
      url = daFase(tema.backgrounds[f], fase);
      if (url) break;
    }
  }
  // Efeito de "pulsação de luzes" — quando ativo no tema, o fundo oscila brilho
  // e saturação suavemente (sensação de luzes respirando, ideal pra hamburgueria,
  // cenas noturnas, neon, etc.). Sem custo de renderização extra (só CSS filter).
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const filtro = tema.efeitoLuzes
    ? (() => {
        const t = frame / fps;
        const b = 1 + 0.23 * Math.sin((t * 2 * Math.PI) / 2.6); // brilho ±23%
        const s = 1 + 0.17 * Math.sin((t * 2 * Math.PI) / 3.4); // saturação ±17%
        return `brightness(${b.toFixed(3)}) saturate(${s.toFixed(3)})`;
      })()
    : undefined;
  if (url) {
    return (
      <AbsoluteFill>
        <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filtro }} />
      </AbsoluteFill>
    );
  }
  return <Background theme={tema} />;
};
