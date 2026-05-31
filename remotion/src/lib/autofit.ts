import { measureText } from '@remotion/layout-utils';

export interface FonteOpts {
  fontFamily: string;
  fontWeight?: number | string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface FitResultado {
  fontSize: number;
  lines: string[];
}

// Quebra o texto em linhas que cabem em maxWidth, na fontSize dada.
// Palavra única maior que a largura fica na própria linha (será reduzida).
function quebrarLinhas(
  texto: string,
  fontSize: number,
  maxWidth: number,
  font: FonteOpts,
): string[] {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [''];
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    const w = measureText({ text: tentativa, fontSize, ...font }).width;
    if (w <= maxWidth || !atual) {
      atual = tentativa;
    } else {
      linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// Autofit: maior fontSize em que o texto cabe na caixa (largura + altura),
// respeitando maxLines. Busca binária — ~8 medições, memoize no componente.
export function fitTextBox(
  texto: string,
  boxW: number,
  boxH: number,
  opts: FonteOpts & {
    maxFontSize: number;
    minFontSize?: number;
    lineHeight?: number;
    maxLines?: number;
  },
): FitResultado {
  const {
    maxFontSize,
    minFontSize = 10,
    lineHeight = 1.05,
    maxLines = 2,
    ...font
  } = opts;

  const cabe = (size: number): string[] | null => {
    const linhas = quebrarLinhas(texto, size, boxW, font);
    if (linhas.length > maxLines) return null;
    const maisLarga = Math.max(
      ...linhas.map((l) => measureText({ text: l, fontSize: size, ...font }).width),
    );
    const alturaTotal = linhas.length * size * lineHeight;
    if (maisLarga <= boxW && alturaTotal <= boxH) return linhas;
    return null;
  };

  let lo = minFontSize;
  let hi = Math.round(maxFontSize);
  let best = minFontSize;
  let bestLines: string[] | null = null;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const linhas = cabe(mid);
    if (linhas) {
      best = mid;
      bestLines = linhas;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (!bestLines) {
    bestLines = quebrarLinhas(texto, minFontSize, boxW, font).slice(0, maxLines);
  }
  return { fontSize: best, lines: bestLines };
}
