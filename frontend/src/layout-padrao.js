// Elementos posicionáveis por fase + posições padrão (frações 0..1 do frame).
// Usado pelo editor de posições, pelo Canvas (prévia) e espelhado no Remotion.
// fase de layout -> background usado: intro->intro, produto->produtos, cta/final->ctaFim.

export const FASES_LAYOUT = [
  { id: 'intro', label: 'Intro', bg: 'intro', elementos: [
    { id: 'introLogo', label: 'Logo' },
    { id: 'introTexto', label: 'Texto de abertura' },
    { id: 'camadaEsq', label: 'Decoração esquerda' },
    { id: 'camadaDir', label: 'Decoração direita' },
  ] },
  { id: 'produto', label: 'Produto', bg: 'produtos', elementos: [
    { id: 'produtoFoto', label: 'Foto do produto' },
    { id: 'produtoNome', label: 'Nome' },
    { id: 'produtoPreco', label: 'Preço' },
    { id: 'produtoInfo', label: 'Observação' },
    { id: 'produtoLogo', label: 'Logo (na cena de produto)' },
  ] },
  { id: 'cta', label: 'CTA', bg: 'cta', elementos: [
    { id: 'ctaTexto', label: 'Chamada (CTA)' },
    { id: 'ctaPeriodo', label: 'Validade' },
    { id: 'camadaEsq', label: 'Decoração esquerda' },
    { id: 'camadaDir', label: 'Decoração direita' },
  ] },
  { id: 'final', label: 'Fim', bg: 'ctaFim', elementos: [
    { id: 'finalLogo', label: 'Logo' },
    { id: 'finalTexto', label: 'Encerramento' },
    { id: 'finalContato', label: 'Contatos (endereço, telefone…)' },
  ] },
];

// Rects padrão (x,y,w,h em fração do frame). Servem de ponto de partida no editor.
export const DEFAULT_LAYOUT = {
  introLogo: { x: 0.20, y: 0.26, w: 0.60, h: 0.13 },
  introTexto: { x: 0.08, y: 0.42, w: 0.84, h: 0.30 },
  produtoFoto: { x: 0.08, y: 0.11, w: 0.84, h: 0.46 },
  produtoNome: { x: 0.06, y: 0.59, w: 0.88, h: 0.12 },
  produtoPreco: { x: 0.10, y: 0.72, w: 0.80, h: 0.17 },
  produtoInfo: { x: 0.10, y: 0.905, w: 0.80, h: 0.05 },
  produtoLogo: { x: 0.44, y: 0.60, w: 0.14, h: 0.22 },
  ctaTexto: { x: 0.08, y: 0.40, w: 0.84, h: 0.16 },
  ctaPeriodo: { x: 0.10, y: 0.59, w: 0.80, h: 0.10 },
  finalLogo: { x: 0.20, y: 0.30, w: 0.60, h: 0.14 },
  finalTexto: { x: 0.08, y: 0.50, w: 0.84, h: 0.24 },
  finalContato: { x: 0.10, y: 0.64, w: 0.80, h: 0.28 },
};

export const TODOS_ELEMENTOS = FASES_LAYOUT.flatMap((f) => f.elementos.map((e) => e.id));

// Posições PADRÃO das camadas decorativas (carrinho/cesta/ícones) por formato.
// ESPELHADO no Remotion (Camadas.tsx) — mantenha os dois iguais.
export const POS_CAMADA = {
  horizontal: { esq: { x: 0.01, y: 0.30, w: 0.30, h: 0.62 }, dir: { x: 0.69, y: 0.30, w: 0.30, h: 0.62 }, icones: { x: 0, y: 0, w: 1, h: 1 } },
  vertical: { esq: { x: 0.0, y: 0.62, w: 0.45, h: 0.30 }, dir: { x: 0.55, y: 0.62, w: 0.45, h: 0.30 }, icones: { x: 0, y: 0, w: 1, h: 1 } },
  quadrado: { esq: { x: 0.0, y: 0.50, w: 0.42, h: 0.40 }, dir: { x: 0.58, y: 0.50, w: 0.42, h: 0.40 }, icones: { x: 0, y: 0, w: 1, h: 1 } },
};
// Rect padrão de uma camada (camadaEsq/camadaDir) p/ um formato.
export function camadaDefault(formato, id) {
  const lado = id === 'camadaDir' ? 'dir' : 'esq';
  return (POS_CAMADA[formato] || POS_CAMADA.horizontal)[lado];
}

// Rect de override (fração) p/ um elemento, ou null se não há posição custom.
export function overrideFrac(tema, formato, elemento) {
  const r = tema?.layout?.[formato]?.[elemento];
  return r && typeof r.x === 'number' ? r : null;
}
