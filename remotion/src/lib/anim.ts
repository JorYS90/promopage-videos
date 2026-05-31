import { interpolate, spring } from 'remotion';
import type { EstiloAnim } from './themes';

// Config de mola por estilo de segmento.
const SPRING: Record<EstiloAnim, { damping: number; mass: number; stiffness: number }> = {
  energetico: { damping: 12, mass: 0.5, stiffness: 220 }, // rápido, com leve overshoot
  suave: { damping: 200, mass: 1, stiffness: 80 },        // sem bounce, gentil
  premium: { damping: 200, mass: 1.2, stiffness: 55 },    // lento, elegante
  divertido: { damping: 8, mass: 0.6, stiffness: 180 },   // bounce divertido
  luxuoso: { damping: 200, mass: 1.4, stiffness: 45 },    // muito lento, sofisticado
};

// Entrada padrão de um elemento: fade + slide-up + scale, com timing por estilo.
export function entrada(
  frame: number,
  fps: number,
  estilo: EstiloAnim,
  delay = 0,
): { opacity: number; transform: string } {
  const f = Math.max(0, frame - delay);
  const p = spring({ frame: f, fps, config: SPRING[estilo] });
  const opacity = interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const slide = interpolate(p, [0, 1], [40, 0]);
  const scale = interpolate(p, [0, 1], [0.86, 1]);
  return { opacity, transform: `translateY(${slide}px) scale(${scale})` };
}

// "Estampa" um elemento: escala de pequeno pra 1 com overshoot (bounce nos estilos
// energético/divertido). Usado no preço pra dar impacto de oferta.
export function pop(
  frame: number,
  fps: number,
  estilo: EstiloAnim,
  delay = 0,
): { opacity: number; scale: number } {
  const f = Math.max(0, frame - delay);
  const p = spring({ frame: f, fps, config: SPRING[estilo] });
  const opacity = interpolate(f, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(p, [0, 1], [0.4, 1]);
  return { opacity, scale };
}

// Revelação da logo (abertura): entra grande+desfocada e assenta em 1:1 nítida,
// com fade. Dá o "reveal" cinematográfico de comercial. Mola por estilo.
export function revelarLogo(
  frame: number,
  fps: number,
  estilo: EstiloAnim,
  delay = 0,
): { opacity: number; transform: string; filter: string } {
  const f = Math.max(0, frame - delay);
  const p = spring({ frame: f, fps, config: SPRING[estilo] });
  const opacity = interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(p, [0, 1], [1.28, 1]);
  const blur = interpolate(f, [0, 12], [12, 0], { extrapolateRight: 'clamp' });
  return { opacity, transform: `scale(${scale})`, filter: `blur(${blur}px)` };
}

// Saída suave no fim de um bloco (últimos `dur` frames).
export function saida(frame: number, totalFrames: number, dur = 8): number {
  return interpolate(frame, [totalFrames - dur, totalFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// Ken Burns lento na imagem do produto (energético = zoom mais forte/rápido).
export function kenBurns(frame: number, durationInFrames: number, estilo: EstiloAnim): string {
  const forte = estilo === 'energetico' || estilo === 'divertido';
  const de = 1;
  const ate = forte ? 1.14 : 1.07;
  const scale = interpolate(frame, [0, durationInFrames], [de, ate], {
    extrapolateRight: 'clamp',
  });
  return `scale(${scale})`;
}

// Movimento de uma camada decorativa (carrinho/cesta/ícones) na intro.
// Retorna estilo (transform/opacity). % do transform = relativo ao próprio elemento.
export function animaCamada(
  tipo: string,
  frame: number,
  fps: number,
  lado: 'esq' | 'dir' | 'cima',
): { transform?: string; opacity?: number } {
  const t = frame / fps;
  switch (tipo) {
    case 'flutuar':
      return { transform: `translateY(${Math.sin(t * 2) * 2.4}%)` };
    case 'balancar':
      return { transform: `rotate(${Math.sin(t * 1.8) * 2.5}deg)` };
    case 'pulsar':
      return { transform: `scale(${1 + Math.sin(t * 2.4) * 0.03})` };
    case 'parallax':
      return { transform: `translate(${Math.sin(t * 0.8) * 1.2}%, ${Math.sin(t * 1.2) * 1.6}%)` };
    case 'deslizar': {
      const p = spring({ frame, fps, config: { damping: 200, mass: 1, stiffness: 90 } });
      const de = lado === 'dir' ? 60 : lado === 'esq' ? -60 : 0;
      const x = interpolate(p, [0, 1], [de, 0]);
      const op = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
      return { transform: `translateX(${x}%)`, opacity: op };
    }
    default:
      return {};
  }
}

// Pulso no preço (chama atenção). Energético pulsa mais.
export function pulsoPreco(frame: number, fps: number, estilo: EstiloAnim): number {
  const amp = estilo === 'energetico' || estilo === 'divertido' ? 0.06 : 0.03;
  const ciclo = Math.sin((frame / fps) * Math.PI * 2 * 1.2);
  return 1 + amp * Math.max(0, ciclo);
}
