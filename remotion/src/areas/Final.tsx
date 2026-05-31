import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Theme } from '../lib/themes';
import type { Empresa, Formato } from '../lib/types';
import { areaUtil } from '../lib/formato';
import { overrideRect } from '../lib/layout';
import { entrada } from '../lib/anim';
import { ff } from '../lib/fonts';
import { AutoText } from './AutoText';
import { Logo } from './Logo';

type TipoIcone = 'local' | 'fone' | 'zap' | 'insta' | 'site' | 'relogio';

// Luminância simples — true quando a cor é escura o bastante p/ aparecer no branco.
const corEscura = (hex?: string) => {
  if (!hex || hex[0] !== '#') return false;
  const h = hex.slice(1);
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 180;
};
// Cor de ícone visível sobre o painel BRANCO: usa destaque/textoForte/rodapé se
// forem escuros; senão cai p/ um azul-escuro padrão.
const iconeNoBranco = (theme: Theme) =>
  [theme.destaque, theme.textoForte, theme.rodapeCor].find(corEscura) || '#1f2937';

// Ícones vetoriais (renderizam certo no chromium headless, sem depender de emoji).
const Icone: React.FC<{ tipo: TipoIcone; size: number; color: string }> = ({ tipo, size, color }) => {
  const c = { width: size, height: size, viewBox: '0 0 24 24' } as const;
  const st = { ...c, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (tipo === 'local')
    return <svg {...c} fill={color}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>;
  if (tipo === 'fone')
    return <svg {...c} fill={color}><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.02l-2.21 2.21z" /></svg>;
  if (tipo === 'zap')
    return <svg {...c} fill={color}><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.3 14.8l-.3-.2-2.6.7.7-2.5-.2-.3A8 8 0 0 1 12 4zm-2.4 3.3c-.2 0-.5 0-.7.4-.2.4-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.7 2 .8 2.5.7 2.9.6.4 0 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1l-.6-.3-1.6-.8c-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.6-.2-1.4-.5-2.2-1.3-.6-.6-1-1.3-1.2-1.5-.1-.2 0-.3.1-.4l.4-.5.3-.5v-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4z" /></svg>;
  if (tipo === 'insta')
    return <svg {...st}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.6" fill={color} /></svg>;
  if (tipo === 'relogio')
    return <svg {...st}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
  return <svg {...st}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></svg>;
};

// AREA_FINAL — encerramento: logo + chamada final + card de contato da loja.
export const Final: React.FC<{
  theme: Theme;
  empresa: Empresa;
  texto: string;
  formato: Formato;
  credito?: string;
}> = ({ theme, empresa, texto, formato, credito }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const area = areaUtil(formato);
  const e1 = entrada(frame, fps, theme.estilo, 0);
  const e2 = entrada(frame, fps, theme.estilo, 6);
  const e3 = entrada(frame, fps, theme.estilo, 12);
  const alturaLogo = Math.round(area.height * 0.16);

  const oLogo = overrideRect(theme, formato, 'finalLogo');
  const oTexto = overrideRect(theme, formato, 'finalTexto');
  const oContato = overrideRect(theme, formato, 'finalContato');

  const horarioTxt = [empresa.dias, empresa.horario].filter(Boolean).join(' · ');
  const linhas: { tipo: TipoIcone; txt: string }[] = [
    empresa.endereco ? { tipo: 'local' as const, txt: empresa.endereco } : null,
    empresa.telefone ? { tipo: 'fone' as const, txt: empresa.telefone } : null,
    empresa.whatsapp ? { tipo: 'zap' as const, txt: empresa.whatsapp } : null,
    empresa.instagram ? { tipo: 'insta' as const, txt: empresa.instagram } : null,
    empresa.site ? { tipo: 'site' as const, txt: empresa.site } : null,
    horarioTxt ? { tipo: 'relogio' as const, txt: horarioTxt } : null,
  ].filter(Boolean) as { tipo: TipoIcone; txt: string }[];
  const temContato = linhas.length > 0;

  const Texto = (w: number, h: number) => (
    <AutoText text={texto} width={w} height={h} fontFamily={ff(theme.fontTitulo)} color={theme.textoForte}
      maxFontSize={Math.round(w * 0.1)} maxLines={3} textTransform="uppercase" textShadow="0 4px 18px rgba(0,0,0,0.35)" />
  );

  const fs = Math.round(area.width * 0.032);
  // claro = sobre o painel branco do fundo (texto escuro, sem card); senão card escuro.
  const Contato = (claro: boolean, w?: number) => (
    <div style={{
      maxWidth: w ?? area.width * 0.86,
      background: claro ? 'transparent' : 'rgba(0,0,0,0.34)',
      borderRadius: area.height * 0.018,
      padding: claro ? 0 : `${area.height * 0.022}px ${area.height * 0.036}px`,
      boxShadow: claro ? 'none' : '0 10px 30px rgba(0,0,0,0.3)',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      gap: `${fs * 0.5}px ${fs * 1.3}px`,
    }}>
      {linhas.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs * 0.45, color: claro ? '#1f2937' : theme.textoForte, fontFamily: ff(theme.fontTexto), fontSize: fs, lineHeight: 1.1, fontWeight: claro ? 600 : 400 }}>
          <Icone tipo={l.tipo} size={fs * 1.15} color={claro ? iconeNoBranco(theme) : theme.destaque} />
          <span>{l.txt}</span>
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: area.width, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: area.height * 0.05 }}>
          {!oLogo && <div style={e1}><Logo empresa={empresa} theme={theme} altura={alturaLogo} /></div>}
          {!oTexto && <div style={e2}>{Texto(area.width, area.height * 0.26)}</div>}
          {temContato && !oContato && <div style={e3}>{Contato(false)}</div>}
        </div>
      </AbsoluteFill>

      {oLogo && (
        <div style={{ position: 'absolute', left: oLogo.x, top: oLogo.y, width: oLogo.w, height: oLogo.h, display: 'flex', alignItems: 'center', justifyContent: 'center', ...e1 }}>
          <Logo empresa={empresa} theme={theme} altura={oLogo.h} box={{ w: oLogo.w, h: oLogo.h }} />
        </div>
      )}
      {oTexto && (
        <div style={{ position: 'absolute', left: oTexto.x, top: oTexto.y, ...e2 }}>{Texto(oTexto.w, oTexto.h)}</div>
      )}
      {temContato && oContato && (
        <div style={{ position: 'absolute', left: oContato.x, top: oContato.y, width: oContato.w, height: oContato.h, display: 'flex', alignItems: 'center', justifyContent: 'center', ...e3 }}>
          {Contato(true, oContato.w)}
        </div>
      )}

      {/* Crédito da trilha (atribuição CC BY) — discreto no rodapé */}
      {credito && (
        <div style={{
          position: 'absolute', left: area.x, top: area.y + area.height - Math.round(area.height * 0.035),
          width: area.width, textAlign: 'center',
          fontFamily: ff(theme.fontTexto), color: theme.textoForte, opacity: 0.82,
          fontSize: Math.round(area.width * 0.024), letterSpacing: '0.3px',
          textShadow: '0 2px 8px rgba(0,0,0,0.45)',
        }}>{credito}</div>
      )}
    </AbsoluteFill>
  );
};
