// Textos padrão por segmento — usados quando não há IA (ou como fallback).
// {empresa} é substituído pelo nome da loja.
const PADROES = {
  supermercado: {
    intro: 'Ofertas da semana no {empresa}',
    final: 'Venha conferir, é no {empresa}',
    cta: 'Corre aproveitar!',
    periodo: 'Ofertas válidas enquanto durarem os estoques',
  },
  farmacia: {
    intro: 'Cuide da sua saúde com as ofertas da {empresa}',
    final: 'Sua saúde em primeiro lugar — {empresa}',
    cta: 'Aproveite agora',
    periodo: 'Promoção por tempo limitado',
  },
  adega: {
    intro: 'Seleção especial na {empresa}',
    final: 'Brinde com a gente — {empresa}',
    cta: 'Garanta o seu',
    periodo: 'Ofertas exclusivas da semana',
  },
  petshop: {
    intro: 'Tudo pro seu pet na {empresa}',
    final: 'Seu melhor amigo merece — {empresa}',
    cta: 'Corre que é por tempo limitado!',
    periodo: 'Ofertas válidas só esta semana',
  },
  perfumaria: {
    intro: 'Beleza e sofisticação na {empresa}',
    final: 'Realce sua beleza — {empresa}',
    cta: 'Aproveite a seleção',
    periodo: 'Edição limitada',
  },
};

function aplicar(texto, empresaNome) {
  return String(texto || '').replace(/\{empresa\}/g, empresaNome || 'nossa loja');
}

function padroesPara(segmento, empresaNome) {
  const p = PADROES[segmento] || PADROES.supermercado;
  return {
    intro: aplicar(p.intro, empresaNome),
    final: aplicar(p.final, empresaNome),
    cta: p.cta,
    periodo: p.periodo,
  };
}

module.exports = { PADROES, padroesPara };
