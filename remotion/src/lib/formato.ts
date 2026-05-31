import type { Formato } from './types';

export interface Dimensao {
  width: number;
  height: number;
}

export const DIMENSOES: Record<Formato, Dimensao> = {
  vertical: { width: 1080, height: 1920 },   // Reels / Stories
  horizontal: { width: 1920, height: 1080 }, // TV interna / YouTube
  quadrado: { width: 1080, height: 1080 },   // Feed
};

// Safe area: margem interna (em px) onde o conteúdo PODE ficar.
// Vertical respeita o "miolo" de Reels/Stories: topo livre p/ avatar/UI,
// base livre p/ legenda/botões. Sempre mantém os textos dentro.
export interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function safeArea(formato: Formato): SafeArea {
  const { width, height } = DIMENSOES[formato];
  if (formato === 'vertical') {
    return {
      top: Math.round(height * 0.11),    // ~210px — fora da zona de UI do topo
      bottom: Math.round(height * 0.16), // ~307px — fora da zona de legenda/CTA
      left: Math.round(width * 0.06),
      right: Math.round(width * 0.06),
    };
  }
  if (formato === 'quadrado') {
    return {
      top: Math.round(height * 0.07),
      bottom: Math.round(height * 0.07),
      left: Math.round(width * 0.06),
      right: Math.round(width * 0.06),
    };
  }
  // horizontal
  return {
    top: Math.round(height * 0.08),
    bottom: Math.round(height * 0.08),
    left: Math.round(width * 0.06),
    right: Math.round(width * 0.06),
  };
}

// Retângulo útil (dentro da safe area).
export function areaUtil(formato: Formato) {
  const { width, height } = DIMENSOES[formato];
  const s = safeArea(formato);
  return {
    x: s.left,
    y: s.top,
    width: width - s.left - s.right,
    height: height - s.top - s.bottom,
  };
}
