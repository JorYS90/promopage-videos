import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Theme } from '../lib/themes';
import type { Empresa, Formato } from '../lib/types';
import { areaUtil } from '../lib/formato';
import { overrideRect } from '../lib/layout';
import { entrada, revelarLogo } from '../lib/anim';
import { ff } from '../lib/fonts';
import { AutoText } from './AutoText';
import { Logo } from './Logo';

// AREA_INTRO + AREA_LOGO — abertura do vídeo.
export const Intro: React.FC<{
  theme: Theme;
  empresa: Empresa;
  texto: string;
  formato: Formato;
}> = ({ theme, empresa, texto, formato }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const area = areaUtil(formato);
  const e1 = revelarLogo(frame, fps, theme.estilo, 0); // logo reveal
  const e2 = entrada(frame, fps, theme.estilo, 6);
  const alturaLogo = Math.round(area.height * 0.14);

  const oLogo = overrideRect(theme, formato, 'introLogo');
  const oTexto = overrideRect(theme, formato, 'introTexto');

  const Texto = (w: number, h: number, maxLines = 3) => (
    <AutoText
      text={texto}
      width={w}
      height={h}
      fontFamily={ff(theme.fontTitulo)}
      color={theme.introTextoCor || theme.textoForte}
      maxFontSize={Math.round(w * 0.14)}
      maxLines={maxLines}
      lineHeight={1.02}
      textTransform="uppercase"
      textShadow="0 4px 18px rgba(0,0,0,0.35)"
    />
  );

  return (
    <AbsoluteFill>
      {/* Pilha central — só os elementos SEM posição custom */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: area.width, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: area.height * 0.05 }}>
          {!oLogo && <div style={e1}><Logo empresa={empresa} theme={theme} altura={alturaLogo} /></div>}
          {!oTexto && (
            <div style={e2}>
              <div style={{ fontFamily: ff(theme.fontTexto), color: theme.destaque, fontSize: alturaLogo * 0.42, letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>Ofertas</div>
              {Texto(area.width, area.height * 0.42)}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* Elementos com posição custom */}
      {oLogo && (
        <div style={{ position: 'absolute', left: oLogo.x, top: oLogo.y, width: oLogo.w, height: oLogo.h, display: 'flex', alignItems: 'center', justifyContent: 'center', ...e1 }}>
          <Logo empresa={empresa} theme={theme} altura={oLogo.h} box={{ w: oLogo.w, h: oLogo.h }} />
        </div>
      )}
      {oTexto && (
        <div style={{ position: 'absolute', left: oTexto.x, top: oTexto.y, ...e2 }}>{Texto(oTexto.w, oTexto.h, 1)}</div>
      )}
    </AbsoluteFill>
  );
};
