import type { Formato, Tema } from './types';
import { DIMENSOES } from './formato';

export interface RectPx { x: number; y: number; w: number; h: number; }

// Rect de override (em px) p/ um elemento, ou null quando não há posição custom
// no tema — nesse caso a area usa seu layout automático.
export function overrideRect(
  tema: Tema | undefined,
  formato: Formato,
  elemento: string,
): RectPx | null {
  const r = tema?.layout?.[formato]?.[elemento];
  if (!r || typeof r.x !== 'number') return null;
  const { width, height } = DIMENSOES[formato] ?? DIMENSOES.vertical;
  return { x: r.x * width, y: r.y * height, w: r.w * width, h: r.h * height };
}
