// Espelho (em JS) do registry de templates do Remotion — usado pelo endpoint
// /api/templates pra o wizard listar opções. Manter em sincronia com
// remotion/src/templates/registry.ts.
const TEMPLATES = [
  { id: 'supermercado-explosao', nome: 'Supermercado — Explosão de Ofertas', segmento: 'supermercado', variante: 'destaque-foto' },
  { id: 'farmacia-clean', nome: 'Farmácia — Clean & Profissional', segmento: 'farmacia', variante: 'split' },
  { id: 'adega-premium', nome: 'Adega — Premium Dourado', segmento: 'adega', variante: 'classico' },
  { id: 'petshop-divertido', nome: 'Petshop — Divertido & Dinâmico', segmento: 'petshop', variante: 'destaque-foto' },
  { id: 'perfumaria-luxo', nome: 'Perfumaria — Luxo & Sofisticação', segmento: 'perfumaria', variante: 'split' },
];

const FORMATOS = [
  { id: 'vertical', nome: 'Vertical (Reels/Stories)', w: 1080, h: 1920 },
  { id: 'horizontal', nome: 'Horizontal (TV/YouTube)', w: 1920, h: 1080 },
  { id: 'quadrado', nome: 'Quadrado (Feed)', w: 1080, h: 1080 },
];

const SEGMENTOS = ['supermercado', 'farmacia', 'adega', 'petshop', 'perfumaria'];

function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
function templatePadraoPara(segmento) {
  return TEMPLATES.find((t) => t.segmento === segmento) || TEMPLATES[0];
}

module.exports = { TEMPLATES, FORMATOS, SEGMENTOS, getTemplate, templatePadraoPara };
