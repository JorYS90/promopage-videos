import React from 'react';
import { Img, interpolate, useCurrentFrame } from 'remotion';
import type { Theme } from '../lib/themes';
import type { Empresa, Formato } from '../lib/types';
import { safeArea, DIMENSOES } from '../lib/formato';
import { ff } from '../lib/fonts';

// SELO / marca d'água — logo (ou nome) pequena fixa no canto, presente durante
// as cenas de produto/CTA. Dá assinatura de marca igual comercial de TV.
// Renderizada fora da TransitionSeries (persiste por cima das transições).
export const Selo: React.FC<{ empresa: Empresa; theme: Theme; formato: Formato }> = ({
  empresa,
  theme,
  formato,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = DIMENSOES[formato];
  const s = safeArea(formato);
  // fade-in curto no começo da sequência (frame relativo = 0).
  const opacity = interpolate(frame, [0, 12], [0, 0.92], { extrapolateRight: 'clamp' });
  const alt = Math.round(height * 0.045); // altura do selo

  const conteudo = empresa.logo ? (
    <Img
      src={empresa.logo}
      style={{ height: alt, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))' }}
    />
  ) : (
    <div
      style={{
        height: alt,
        padding: `0 ${alt * 0.42}px`,
        display: 'flex',
        alignItems: 'center',
        background: `${theme.destaque}cc`,
        color: theme.textoPreco,
        borderRadius: alt * 0.28,
        fontFamily: ff(theme.fontTitulo),
        fontSize: alt * 0.46,
        letterSpacing: 1,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
      }}
    >
      {empresa.nome}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: s.top,
        right: s.right,
        maxWidth: width * 0.55,
        opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {conteudo}
    </div>
  );
};
