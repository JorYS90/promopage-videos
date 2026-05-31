import React from 'react';
import { Img } from 'remotion';
import type { Theme } from '../lib/themes';
import type { Empresa } from '../lib/types';
import { ff } from '../lib/fonts';

// AREA_LOGO — logo da empresa. Sem logo, mostra o nome num selo da paleta.
// `box` (opcional): quando posicionada por um rect custom, a logo PREENCHE a caixa
// (usa largura+altura). Sem box, dimensiona pela `altura` (pilha central).
export const Logo: React.FC<{ empresa: Empresa; theme: Theme; altura: number; box?: { w: number; h: number } }> = ({
  empresa,
  theme,
  altura,
  box,
}) => {
  if (empresa.logo) {
    const f = empresa.logoFundo || 'transparente';
    const dark = f.startsWith('escuro');
    const round = f.endsWith('redondo');
    const preencher = !!box;
    // Sem fundo: só a imagem (com sombra leve pra destacar).
    if (f === 'transparente') {
      const imgStyle: React.CSSProperties = preencher
        ? { width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.35))' }
        : { height: altura, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.35))' };
      return <Img src={empresa.logo} style={imgStyle} />;
    }
    const base = {
      background: dark ? '#1f2937' : '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    } as const;
    // Redondo: círculo. Preenchendo → ocupa o menor lado da caixa.
    if (round) {
      const d = preencher ? Math.min(box!.w, box!.h) : altura;
      return (
        <div style={{ ...base, width: d, height: d, borderRadius: '50%' }}>
          <Img src={empresa.logo} style={{ maxWidth: '74%', maxHeight: '74%', objectFit: 'contain' }} />
        </div>
      );
    }
    // Retângulo: preenchendo → ocupa toda a caixa.
    if (preencher) {
      const r = Math.min(box!.w, box!.h);
      return (
        <div style={{ ...base, width: '100%', height: '100%', borderRadius: r * 0.12, padding: r * 0.1 }}>
          <Img src={empresa.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      );
    }
    return (
      <div style={{ ...base, height: altura, padding: altura * 0.14, borderRadius: altura * 0.18 }}>
        <Img src={empresa.logo} style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
      </div>
    );
  }
  return (
    <div
      style={{
        height: altura,
        padding: `0 ${altura * 0.4}px`,
        background: theme.destaque,
        color: theme.textoPreco,
        borderRadius: altura * 0.2,
        display: 'flex',
        alignItems: 'center',
        fontFamily: ff(theme.fontTitulo),
        fontSize: altura * 0.5,
        letterSpacing: 1,
        textTransform: 'uppercase',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      {empresa.nome}
    </div>
  );
};
