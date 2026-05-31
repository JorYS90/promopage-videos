import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Theme } from '../lib/themes';
import type { Formato } from '../lib/types';
import { areaUtil } from '../lib/formato';
import { overrideRect } from '../lib/layout';
import { entrada, pop, pulsoPreco } from '../lib/anim';
import { ff } from '../lib/fonts';
import { AutoText } from './AutoText';

// AREA_CTA + AREA_PERIODO — chamada pra ação + validade da oferta.
export const Cta: React.FC<{
  theme: Theme;
  cta: string;
  periodo: string;
  formato: Formato;
}> = ({ theme, cta, periodo, formato }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const area = areaUtil(formato);
  const e2 = entrada(frame, fps, theme.estilo, 8);
  const popCta = pop(frame, fps, theme.estilo, 0); // CTA estampa
  const pulso = pulsoPreco(frame, fps, theme.estilo);
  const estiloCta = { opacity: popCta.opacity, transform: `scale(${popCta.scale * pulso})` };

  const oCta = overrideRect(theme, formato, 'ctaTexto');
  const oPer = overrideRect(theme, formato, 'ctaPeriodo');

  // Chamada SEM fundo (linear): texto centralizado que quebra em até 2 linhas e
  // encolhe pra caber na caixa (igual texto centralizado do Word).
  const Chamada = (w: number, h: number) => (
    <AutoText
      text={cta}
      width={w}
      height={h}
      fontFamily={ff(theme.fontTitulo)}
      color={theme.textoForte}
      maxFontSize={Math.round(w * 0.16)}
      maxLines={2}
      lineHeight={1.05}
      textTransform="uppercase"
      textShadow="0 4px 16px rgba(0,0,0,0.4)"
    />
  );
  const Periodo = (w: number, h: number) => (
    <AutoText text={periodo} width={w} height={h} fontFamily={ff(theme.fontTexto)} color={theme.textoForte}
      maxFontSize={Math.round(w * 0.07)} maxLines={1} textTransform="uppercase" letterSpacing="1px" />
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: area.width, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: area.height * 0.06 }}>
          {!oCta && <div style={estiloCta}>{Chamada(area.width * 0.92, area.height * 0.22)}</div>}
          {!oPer && periodo && <div style={e2}>{Periodo(area.width * 0.9, area.height * 0.16)}</div>}
        </div>
      </AbsoluteFill>

      {oCta && (
        <div style={{ position: 'absolute', left: oCta.x, top: oCta.y, width: oCta.w, height: oCta.h, display: 'flex', alignItems: 'center', justifyContent: 'center', ...estiloCta }}>{Chamada(oCta.w, oCta.h)}</div>
      )}
      {oPer && periodo && (
        <div style={{ position: 'absolute', left: oPer.x, top: oPer.y, ...e2 }}>{Periodo(oPer.w, oPer.h)}</div>
      )}
    </AbsoluteFill>
  );
};
