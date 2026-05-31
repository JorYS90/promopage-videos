import React from 'react';
import type { Theme } from '../lib/themes';
import type { Empresa, Formato, Regras } from '../lib/types';
import { DIMENSOES } from '../lib/formato';
import { ff } from '../lib/fonts';

// Cor de texto que contrasta com a cor da barra (claro -> texto escuro).
function corContraste(bg: string): string {
  const h = (bg || '').replace('#', '');
  if (h.length < 6) return '#ffffff';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1f2937' : '#ffffff';
}

// Ícones do rodapé (vetoriais).
const IconeR: React.FC<{ tipo: string; size: number; color: string }> = ({ tipo, size, color }) => {
  const c = { width: size, height: size, viewBox: '0 0 24 24' } as const;
  const st = { ...c, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (tipo === 'local') return <svg {...c} fill={color}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>;
  if (tipo === 'cal') return <svg {...st}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>;
  if (tipo === 'box') return <svg {...st}><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v9" /></svg>;
  if (tipo === 'img') return <svg {...st}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5-5L5 20" /></svg>;
  return <svg {...st}><path d="M12 3l10 17H2z" /><path d="M12 9.5v4.5M12 17.4v.2" /></svg>;
};

// RODAPÉ — barra colorida (cor do tema) com slots: validade, avisos legais e
// endereço. Aparece só nas cenas de produto (controlado no Video.tsx).
export const Rodape: React.FC<{ regras?: Regras; empresa?: Empresa; theme: Theme; formato: Formato }> = ({
  regras,
  empresa,
  theme,
  formato,
}) => {
  const fmt = (iso?: string) => {
    if (!iso) return '';
    const [, m, d] = iso.split('-');
    return d && m ? `${d}/${m}` : '';
  };

  const itens: { ic: string; txt: string }[] = [];
  if (regras?.mostrarDatas && regras.dataInicio && regras.dataFinal) {
    itens.push({ ic: 'cal', txt: `Válido de ${fmt(regras.dataInicio)} a ${fmt(regras.dataFinal)}` });
  }
  if (regras?.enquantoEstoque) itens.push({ ic: 'box', txt: 'Enquanto durarem os estoques' });
  if (regras?.imagensIlustrativas) itens.push({ ic: 'img', txt: 'Imagens meramente ilustrativas' });
  if (regras?.advertenciaMedicamento) itens.push({ ic: 'warn', txt: 'Se persistirem os sintomas, o médico deverá ser consultado' });
  if (empresa?.endereco) itens.push({ ic: 'local', txt: empresa.endereco });
  if (!itens.length) return null;

  const { width, height } = DIMENSOES[formato];
  const cor = theme.rodapeCor || theme.destaque;
  const txt = corContraste(cor);
  const filetCor = theme.rodapeFiletCor || theme.fundo || '#ffffff';
  const filetH = Math.max(4, Math.round(height * 0.006));
  // Escala por formato: vertical/quadrado são estreitos, então o rodapé precisa
  // de fonte maior (proporcional) pra não ficar fininho.
  const fsFactor = formato === 'horizontal' ? 0.017 : 0.037;
  const fs = Math.round(width * fsFactor);

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, boxShadow: '0 -6px 18px rgba(0,0,0,0.25)' }}>
      {/* filete de separação */}
      <div style={{ height: filetH, background: filetCor }} />
      <div
        style={{
          background: cor,
          color: txt,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${fs * 0.4}px ${fs}px`,
          padding: `${fs * 0.8}px ${fs * 1.4}px`,
          fontFamily: ff(theme.fontTexto),
          fontSize: fs,
          fontWeight: 600,
          lineHeight: 1.1,
        }}
      >
        {itens.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ opacity: 0.4, fontWeight: 400 }}>|</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: fs * 0.4 }}>
              <IconeR tipo={it.ic} size={fs * 1.15} color={txt} />
              {it.txt}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
