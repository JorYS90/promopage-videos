// Carrega as fontes do PromoPage via @remotion/google-fonts.
// PERFORMANCE: carregamos só os pesos usados + subset 'latin'. Sem isso, o
// loadFont() baixa TODOS os pesos/subsets (dezenas de requests por aba do render),
// o que deixava a renderização lenta. Mesmas famílias do encarte.
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadBebas } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed';

const COMUM = { subsets: ['latin'], ignoreTooManyRequestsWarning: true } as const;

const anton = loadAnton('normal', { weights: ['400'], ...COMUM });
const bebas = loadBebas('normal', { weights: ['400'], ...COMUM });
const barlow = loadBarlow('normal', { weights: ['400', '700', '900'], ...COMUM });

const MAP: Record<string, string> = {
  Anton: anton.fontFamily,
  'Bebas Neue': bebas.fontFamily,
  'Barlow Condensed': barlow.fontFamily,
};

// Resolve o nome "amigável" do theme pro fontFamily real carregado.
export function ff(nome: string): string {
  return MAP[nome] ?? nome;
}
