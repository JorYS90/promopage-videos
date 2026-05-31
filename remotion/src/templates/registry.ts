import type { Formato, Segmento } from '../lib/types';
import type { Theme } from '../lib/themes';
import { THEMES } from '../lib/themes';

// Um Template = design "pronto" que a IA não altera, só preenche e anima.
// variante controla o arranjo da AREA_PRODUTO; themeOverride ajusta a paleta.
export interface Template {
  id: string;
  nome: string;
  segmento: Segmento;
  formatos: Formato[];
  variante: 'classico' | 'destaque-foto' | 'split';
  themeOverride?: Partial<Theme>;
}

const TODOS_FORMATOS: Formato[] = ['vertical', 'horizontal', 'quadrado'];

export const TEMPLATES: Template[] = [
  {
    id: 'supermercado-explosao',
    nome: 'Supermercado — Explosão de Ofertas',
    segmento: 'supermercado',
    formatos: TODOS_FORMATOS,
    variante: 'destaque-foto',
  },
  {
    id: 'farmacia-clean',
    nome: 'Farmácia — Clean & Profissional',
    segmento: 'farmacia',
    formatos: TODOS_FORMATOS,
    variante: 'split',
  },
  {
    id: 'adega-premium',
    nome: 'Adega — Premium Dourado',
    segmento: 'adega',
    formatos: TODOS_FORMATOS,
    variante: 'classico',
  },
  {
    id: 'petshop-divertido',
    nome: 'Petshop — Divertido & Dinâmico',
    segmento: 'petshop',
    formatos: TODOS_FORMATOS,
    variante: 'destaque-foto',
  },
  {
    id: 'perfumaria-luxo',
    nome: 'Perfumaria — Luxo & Sofisticação',
    segmento: 'perfumaria',
    formatos: TODOS_FORMATOS,
    variante: 'split',
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function templatePadraoPara(segmento: Segmento): Template {
  return TEMPLATES.find((t) => t.segmento === segmento) ?? TEMPLATES[0];
}

// Theme final aplicado: base do segmento do template + overrides do template.
export function themeDoTemplate(t: Template): Theme {
  return { ...THEMES[t.segmento], ...(t.themeOverride ?? {}) };
}
