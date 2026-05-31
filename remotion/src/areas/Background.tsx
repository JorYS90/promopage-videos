import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { Theme } from '../lib/themes';

// Fundo "design pronto" do template: gradiente da paleta + formas decorativas
// sutis que se movem devagar (não competem com o conteúdo).
export const Background: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 20;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 50% 0%, ${theme.fundo} 0%, ${theme.fundoAlt} 100%)`,
      }}
    >
      {/* brilho de acento no topo */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% -10%, ${theme.destaque}22 0%, transparent 60%)`,
        }}
      />
      {/* círculos decorativos */}
      <div
        style={{
          position: 'absolute',
          top: -120 + drift,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: `${theme.destaque}1f`,
          filter: 'blur(2px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -140 - drift,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `${theme.destaque}14`,
        }}
      />
    </AbsoluteFill>
  );
};
