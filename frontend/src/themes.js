// Espelho dos temas do Remotion (remotion/src/lib/themes.ts) — só os tokens de
// cor/fonte que o CANVAS de prévia precisa. Manter em sincronia.
// Conceito (igual promopage): o tema é o "fundo pronto"; produtos e textos
// aparecem por cima nas áreas.
export const THEMES = {
  supermercado: {
    estilo: 'energético',
    fundo: '#b91c1c', fundoAlt: '#7f1d1d', destaque: '#fde047',
    pilulaPreco: '#fde047', textoPreco: '#7f1d1d',
    textoForte: '#ffffff', textoSuave: '#fee2e2',
    ctaFundo: '#fde047', ctaTexto: '#7f1d1d',
    fontTitulo: 'Anton', fontPreco: 'Anton', fontTexto: 'Barlow Condensed',
  },
  farmacia: {
    estilo: 'clean',
    fundo: '#0e7490', fundoAlt: '#155e75', destaque: '#a7f3d0',
    pilulaPreco: '#ffffff', textoPreco: '#0e7490',
    textoForte: '#ffffff', textoSuave: '#cffafe',
    ctaFundo: '#10b981', ctaTexto: '#ffffff',
    fontTitulo: 'Barlow Condensed', fontPreco: 'Anton', fontTexto: 'Barlow Condensed',
  },
  adega: {
    estilo: 'premium',
    fundo: '#1c1917', fundoAlt: '#0c0a09', destaque: '#d4af37',
    pilulaPreco: '#d4af37', textoPreco: '#1c1917',
    textoForte: '#f5f5f4', textoSuave: '#d6d3d1',
    ctaFundo: '#d4af37', ctaTexto: '#1c1917',
    fontTitulo: 'Bebas Neue', fontPreco: 'Anton', fontTexto: 'Barlow Condensed',
  },
  petshop: {
    estilo: 'divertido',
    fundo: '#f97316', fundoAlt: '#ea580c', destaque: '#22d3ee',
    pilulaPreco: '#ffffff', textoPreco: '#ea580c',
    textoForte: '#ffffff', textoSuave: '#ffedd5',
    ctaFundo: '#22d3ee', ctaTexto: '#0c4a6e',
    fontTitulo: 'Anton', fontPreco: 'Anton', fontTexto: 'Barlow Condensed',
  },
  perfumaria: {
    estilo: 'luxuoso',
    fundo: '#3b0764', fundoAlt: '#1e1b4b', destaque: '#e9d5ff',
    pilulaPreco: '#f5f3ff', textoPreco: '#3b0764',
    textoForte: '#faf5ff', textoSuave: '#e9d5ff',
    ctaFundo: '#e9d5ff', ctaTexto: '#3b0764',
    fontTitulo: 'Bebas Neue', fontPreco: 'Bebas Neue', fontTexto: 'Barlow Condensed',
  },
};

export const ASPECTO = {
  vertical: 1080 / 1920,
  horizontal: 1920 / 1080,
  quadrado: 1,
};

export function getTheme(segmento) {
  return THEMES[segmento] || THEMES.supermercado;
}
