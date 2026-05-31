// Tipos compartilhados entre Remotion, backend e frontend.
// (O backend valida com zod em backend/src/schema.js — manter em sincronia.)

import type { Theme } from './themes';

export type Formato = 'vertical' | 'horizontal' | 'quadrado';

// Tema completo (built-in gradiente OU custom por imagem). Vem do backend /api/temas.
export interface Tema extends Theme {
  id?: string;
  nome?: string;
  tipo?: 'gradiente' | 'imagem';
  // backgrounds por formato: cada formato tem 3 fases (intro/produtos/ctaFim)
  backgrounds?: Partial<Record<Formato, { intro?: string; produtos?: string; cta?: string; ctaFim?: string }>>;
  balaoPreco?: string;
  // área branca interna do balão (fração do PNG) — onde o preço encaixa. Detectada no upload.
  balaoTextoArea?: { x: number; y: number; w: number; h: number } | null;
  precoAnim?: AnimCamada; // movimento do balão/preço (flutuar/deslizar/...) — escolhido no tema
  precoTransparente?: boolean; // preço só texto (sem balão/pílula)
  efeitoLuzes?: boolean; // pulsação suave do fundo (brilho/saturação) — pra cenas com luzes/neon
  // posições custom (override) por formato -> elemento -> rect em fração (0..1)
  layout?: Partial<Record<Formato, Record<string, { x: number; y: number; w: number; h: number }>>>;
  // camadas decorativas animadas da intro (PNG recortado + movimento), por formato
  camadas?: Partial<Record<Formato, { esq?: Camada; dir?: Camada; icones?: Camada }>>;
}

export type AnimCamada = 'flutuar' | 'deslizar' | 'parallax' | 'balancar' | 'pulsar' | 'nenhum';
export interface Camada {
  img?: string;        // PNG recortado (fundo removido)
  anim?: AnimCamada;   // movimento no vídeo
}

export type Segmento =
  | 'supermercado'
  | 'farmacia'
  | 'adega'
  | 'petshop'
  | 'perfumaria';

export interface Produto {
  nome: string;
  preco: string;        // ex: "9,99"  (sem "R$" — o template adiciona)
  precoDe?: string;     // preço "de" riscado (opcional)
  unidade?: string;     // ex: "kg", "un", "cada" (opcional)
  imagem?: string;      // URL absoluta servida pelo backend (/uploads/...)
  info?: string;        // AREA_INFO_EXTRA — observação do produto (opcional)
}

export interface Empresa {
  nome: string;
  logo?: string;        // URL da logo (opcional)
  logoFundo?: string;   // 'escuro'|'escuro-redondo'|'claro'|'claro-redondo'|'transparente'
  endereco?: string;    // card final — "Rua X, 123 - Centro" (opcional)
  telefone?: string;    // card final — "(11) 99999-0000" (opcional)
  site?: string;        // card final — "loja.com.br" (opcional)
  whatsapp?: string;    // card final — WhatsApp (opcional)
  instagram?: string;   // card final — "@loja" (opcional)
  horario?: string;     // card final — "8h às 20h" (opcional)
  dias?: string;        // card final — "Seg a Sáb" (opcional)
}

// Regras/legais do comercial (período de validade + avisos). Onde aparece nas
// cenas é configurável depois; por ora vão no rodapé + período no CTA.
export interface Regras {
  dataInicio?: string;   // 'YYYY-MM-DD'
  dataFinal?: string;    // 'YYYY-MM-DD'
  mostrarDatas?: boolean;
  enquantoEstoque?: boolean;
  imagensIlustrativas?: boolean;
  advertenciaMedicamento?: boolean;
  mostrarFrase?: boolean;
  frasePromocional?: string;
}

export interface Audio {
  trilha?: string;          // URL música de fundo (opcional)
  narracaoIntro?: string;   // URL narração de abertura (opcional)
  narracaoProdutos?: (string | null)[]; // URL narração por produto (por índice)
  narracaoCta?: string;     // URL narração do CTA (opcional)
  narracaoFinal?: string;   // URL narração de encerramento (opcional)
}

// Props que a composition recebe. É o "contrato" do job de render.
export interface PromoProps {
  formato: Formato;
  segmento: Segmento;
  templateId: string;
  empresa: Empresa;
  produtos: Produto[];       // 3..7
  cta: string;               // AREA_CTA — "Corre aproveitar"
  periodo: string;           // AREA_PERIODO — "Só até domingo"
  introTexto: string;        // AREA_INTRO — "Ofertas da semana no..."
  finalTexto: string;        // AREA_FINAL — "Venha conferir nossa loja"
  tema?: Tema;               // tema completo (sobrepõe o templateId quando presente)
  duracoesProduto?: number[]; // segundos por produto (ajusta cena à narração)
  duracoesCena?: { intro?: number; cta?: number; final?: number }; // idem p/ intro/cta/fim
  audio?: Audio;
  creditoTrilha?: string;    // crédito CC BY da trilha (ex: "Música: Autor (CC BY 4.0)")
  sfx?: boolean;             // efeitos sonoros de impacto (whoosh/pop) — padrão true
  regras?: Regras;           // validade + avisos legais do comercial
}
