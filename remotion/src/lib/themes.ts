import type { Segmento } from './types';

// Estilo de animação por segmento (do prompt):
//  supermercado: rápido/energético/zoom · farmácia: clean/suave · adega: elegante/premium
//  petshop: divertido/dinâmico · perfumaria: sofisticado/luxuoso
export type EstiloAnim = 'energetico' | 'suave' | 'premium' | 'divertido' | 'luxuoso';

export interface Theme {
  segmento: Segmento;
  estilo: EstiloAnim;
  // Paleta — o "design pronto" que a IA NÃO altera, só preenche.
  fundo: string;          // cor/gradiente base do vídeo
  fundoAlt: string;       // segunda cor do gradiente
  destaque: string;       // cor de acento (selos, linhas)
  pilulaPreco: string;    // fundo da pílula de preço
  textoPreco: string;     // cor do número do preço
  textoForte: string;     // títulos / nome do produto
  textoSuave: string;     // textos secundários
  introTextoCor?: string; // cor da fonte do texto de abertura (intro) — escolhida no tema
  ctaFundo: string;       // fundo do selo de CTA
  ctaTexto: string;
  rodapeCor?: string;     // cor da barra de rodapé (avisos/validade) — escolhida no tema
  rodapeFiletCor?: string; // cor do filete (faixa fina) de separação no topo do rodapé
  precoAnim?: string;      // movimento do balão de preço (flutuar/deslizar/parallax/...)
  precoTransparente?: boolean; // preço só texto (sem balão/pílula)
  efeitoLuzes?: boolean;   // pulsação suave do fundo (luzes "respirando")
  // Fontes (carregadas em lib/fonts.ts)
  fontTitulo: string;     // nomes / chamadas
  fontPreco: string;      // preço impactante
  fontTexto: string;      // corpo
}

export const THEMES: Record<Segmento, Theme> = {
  supermercado: {
    segmento: 'supermercado',
    estilo: 'energetico',
    fundo: '#b91c1c',
    fundoAlt: '#7f1d1d',
    destaque: '#fde047',
    pilulaPreco: '#fde047',
    textoPreco: '#7f1d1d',
    textoForte: '#ffffff',
    textoSuave: '#fee2e2',
    ctaFundo: '#fde047',
    ctaTexto: '#7f1d1d',
    fontTitulo: 'Anton',
    fontPreco: 'Anton',
    fontTexto: 'Barlow Condensed',
  },
  farmacia: {
    segmento: 'farmacia',
    estilo: 'suave',
    fundo: '#0e7490',
    fundoAlt: '#155e75',
    destaque: '#a7f3d0',
    pilulaPreco: '#ffffff',
    textoPreco: '#0e7490',
    textoForte: '#ffffff',
    textoSuave: '#cffafe',
    ctaFundo: '#10b981',
    ctaTexto: '#ffffff',
    fontTitulo: 'Barlow Condensed',
    fontPreco: 'Anton',
    fontTexto: 'Barlow Condensed',
  },
  adega: {
    segmento: 'adega',
    estilo: 'premium',
    fundo: '#1c1917',
    fundoAlt: '#0c0a09',
    destaque: '#d4af37',
    pilulaPreco: '#d4af37',
    textoPreco: '#1c1917',
    textoForte: '#f5f5f4',
    textoSuave: '#d6d3d1',
    ctaFundo: '#d4af37',
    ctaTexto: '#1c1917',
    fontTitulo: 'Bebas Neue',
    fontPreco: 'Anton',
    fontTexto: 'Barlow Condensed',
  },
  petshop: {
    segmento: 'petshop',
    estilo: 'divertido',
    fundo: '#f97316',
    fundoAlt: '#ea580c',
    destaque: '#22d3ee',
    pilulaPreco: '#ffffff',
    textoPreco: '#ea580c',
    textoForte: '#ffffff',
    textoSuave: '#ffedd5',
    ctaFundo: '#22d3ee',
    ctaTexto: '#0c4a6e',
    fontTitulo: 'Anton',
    fontPreco: 'Anton',
    fontTexto: 'Barlow Condensed',
  },
  perfumaria: {
    segmento: 'perfumaria',
    estilo: 'luxuoso',
    fundo: '#3b0764',
    fundoAlt: '#1e1b4b',
    destaque: '#e9d5ff',
    pilulaPreco: '#f5f3ff',
    textoPreco: '#3b0764',
    textoForte: '#faf5ff',
    textoSuave: '#e9d5ff',
    ctaFundo: '#e9d5ff',
    ctaTexto: '#3b0764',
    fontTitulo: 'Bebas Neue',
    fontPreco: 'Bebas Neue',
    fontTexto: 'Barlow Condensed',
  },
};

export function getTheme(segmento: Segmento): Theme {
  return THEMES[segmento] ?? THEMES.supermercado;
}
