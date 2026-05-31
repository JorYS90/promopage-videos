// Store de Temas — built-in (gradiente) + custom (imagem, criados pelo admin).
// Shape canônico consumido pelo frontend (galeria/preview) E pelo Remotion (render).
//   tipo: 'gradiente'  -> usa fundo/fundoAlt (degradê gerado)
//   tipo: 'imagem'     -> usa backgrounds[formato].{intro,produtos,ctaFim} (uploads)
// backgrounds é POR FORMATO: vertical/horizontal/quadrado, cada um com 3 fases.
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const { DATA_DIR } = require('./config');

const ARQ = path.join(DATA_DIR, 'temas.json');

function temaBase(over) {
  return {
    id: '',
    nome: '',
    categoria: 'Meus Temas',
    segmento: 'supermercado',
    estilo: 'energetico', // energetico|suave|premium|divertido|luxuoso
    tipo: 'gradiente',
    // gradiente
    fundo: '#b91c1c',
    fundoAlt: '#7f1d1d',
    destaque: '#fde047',
    // imagem (uploads) — 3 fases por formato
    backgrounds: {
      vertical: { intro: '', produtos: '', cta: '', ctaFim: '' },
      horizontal: { intro: '', produtos: '', cta: '', ctaFim: '' },
      quadrado: { intro: '', produtos: '', cta: '', ctaFim: '' },
    },
    balaoPreco: '',
    balaoTextoArea: null, // área interna do balão (fração) p/ encaixar o preço
    precoAnim: 'flutuar', // movimento do balão de preço
    precoTransparente: false, // preço só texto (sem balão/pílula) — fundo já tem o painel
    efeitoLuzes: false, // pulsação suave do fundo (brilho/saturação) p/ temas com luzes/neon
    // posições custom (override) por formato -> elemento -> rect em fração (0..1).
    // vazio = todos os elementos usam o layout automático.
    layout: {},
    // camadas decorativas animadas da intro (PNG recortado + movimento), por formato
    camadas: {
      vertical: { esq: { img: '', anim: 'flutuar' }, dir: { img: '', anim: 'flutuar' }, icones: { img: '', anim: 'parallax' } },
      horizontal: { esq: { img: '', anim: 'flutuar' }, dir: { img: '', anim: 'flutuar' }, icones: { img: '', anim: 'parallax' } },
      quadrado: { esq: { img: '', anim: 'flutuar' }, dir: { img: '', anim: 'flutuar' }, icones: { img: '', anim: 'parallax' } },
    },
    // cores compartilhadas
    pilulaPreco: '#fde047',
    textoPreco: '#7f1d1d',
    textoForte: '#ffffff',
    textoSuave: '#fee2e2',
    introTextoCor: '', // vazio = usa textoForte; preenchido = cor própria da abertura
    ctaFundo: '#fde047',
    ctaTexto: '#7f1d1d',
    rodapeCor: '#1e3a8a', // barra de rodapé (avisos/validade)
    rodapeFiletCor: '#e11d2a', // filete de separação no topo do rodapé
    // fontes (Anton | Bebas Neue | Barlow Condensed)
    fontTitulo: 'Anton',
    fontPreco: 'Anton',
    fontTexto: 'Barlow Condensed',
    ...over,
  };
}

// Temas de exemplo removidos a pedido do usuário — a galeria mostra só os temas
// criados por ele (custom). (Histórico no git, caso queira recuperar.)
const BUILTIN = [];

function carregarCustom() {
  try { return JSON.parse(fs.readFileSync(ARQ, 'utf8')); } catch { return []; }
}
function salvarCustom(lista) {
  fs.writeFile(ARQ, JSON.stringify(lista, null, 2), () => {});
}

// (Seed do "Supermercado Padrão" removido — a galeria começa só com os temas
// criados pelo usuário.)

function listar() {
  return [...BUILTIN, ...carregarCustom()];
}
function obter(id) {
  return listar().find((t) => t.id === id) || null;
}
function criar(dados) {
  const custom = carregarCustom();
  const tema = temaBase({
    ...dados,
    id: 'tema-' + nanoid(8),
    tipo: 'imagem',
    categoria: dados.categoria || 'Meus Temas',
    custom: true,
  });
  custom.push(tema);
  salvarCustom(custom);
  return tema;
}

// Atualiza um tema CUSTOM (built-in não é editável). Retorna o tema ou null.
function atualizar(id, dados) {
  const custom = carregarCustom();
  const i = custom.findIndex((t) => t.id === id);
  if (i === -1) return null;
  const atualizado = temaBase({ ...custom[i], ...dados, id, tipo: 'imagem', custom: true });
  custom[i] = atualizado;
  salvarCustom(custom);
  return atualizado;
}

// Remove um tema CUSTOM. Retorna true/false.
function remover(id) {
  const custom = carregarCustom();
  const i = custom.findIndex((t) => t.id === id);
  if (i === -1) return false;
  custom.splice(i, 1);
  salvarCustom(custom);
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover, BUILTIN };
