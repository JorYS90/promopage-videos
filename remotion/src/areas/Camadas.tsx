import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Formato, Tema } from '../lib/types';
import { animaCamada } from '../lib/anim';

interface Rect { x: number; y: number; w: number; h: number; }
type Pos = { esq: Rect; dir: Rect; icones: Rect };

// Posições PADRÃO das camadas por formato (fração). ESPELHADO no front
// (layout-padrao.js POS_CAMADA) — mantenha iguais. esq/dir podem ser sobrescritos
// pelo layout do tema (camadaEsq/camadaDir) via editor de posições.
const POS: Record<Formato, Pos> = {
  horizontal: {
    esq: { x: 0.01, y: 0.30, w: 0.30, h: 0.62 },
    dir: { x: 0.69, y: 0.30, w: 0.30, h: 0.62 },
    icones: { x: 0, y: 0, w: 1, h: 1 },
  },
  vertical: {
    esq: { x: 0.0, y: 0.62, w: 0.45, h: 0.30 },
    dir: { x: 0.55, y: 0.62, w: 0.45, h: 0.30 },
    icones: { x: 0, y: 0, w: 1, h: 1 },
  },
  quadrado: {
    esq: { x: 0.0, y: 0.50, w: 0.42, h: 0.40 },
    dir: { x: 0.58, y: 0.50, w: 0.42, h: 0.40 },
    icones: { x: 0, y: 0, w: 1, h: 1 },
  },
};
const OV_ID = { esq: 'camadaEsq', dir: 'camadaDir', icones: 'camadaIcones' } as const;

// Camadas decorativas animadas da intro (carrinho/cesta/ícones recortados).
export const Camadas: React.FC<{ tema?: Tema; formato: Formato }> = ({ tema, formato }) => {
  const c = tema?.camadas?.[formato];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!c) return null;

  const pos = POS[formato];
  // override de posição vindo do editor (layout do tema), em fração; senão usa POS.
  const ov = (key: 'esq' | 'dir' | 'icones'): Rect | null => {
    const r = tema?.layout?.[formato]?.[OV_ID[key]] as Rect | undefined;
    return r && typeof r.x === 'number' ? r : null;
  };
  const camada = (key: 'esq' | 'dir' | 'icones', lado: 'esq' | 'dir' | 'cima', sombra: boolean) => {
    const cam = c[key];
    if (!cam?.img) return null;
    const r = ov(key) || pos[key];
    const a = animaCamada(cam.anim || 'nenhum', frame, fps, lado);
    return (
      <div style={{ position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%`, ...a }}>
        <Img
          src={cam.img}
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: sombra ? 'drop-shadow(0 14px 30px rgba(0,0,0,0.35))' : undefined }}
        />
      </div>
    );
  };

  return (
    <AbsoluteFill>
      {camada('icones', 'cima', false)}
      {camada('esq', 'esq', true)}
      {camada('dir', 'dir', true)}
    </AbsoluteFill>
  );
};
