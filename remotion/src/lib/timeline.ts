// Timeline automática: ajusta a duração total conforme a quantidade de produtos.
// Slots fixos (em frames @ 30fps); o total cresce com o nº de produtos.

export const FPS = 30;

// Duração da transição (crossfade/slide) entre cenas, em frames (~0,4s).
export const DUR_TRANSICAO = 12;

// Duração de cada bloco, em segundos.
const SEG = {
  intro: 2.5,
  produto: 3,
  cta: 2.5,
  final: 2.5,
};

export type SegmentoTipo = 'intro' | 'produto' | 'cta' | 'final';

export interface Bloco {
  tipo: SegmentoTipo;
  from: number;             // frame inicial
  durationInFrames: number;
  indiceProduto?: number;   // 0-based, só quando tipo === 'produto'
}

export const sToF = (s: number) => Math.round(s * FPS);

// Durações (em segundos) das narrações das cenas fixas — quando há voz, a cena
// estica pra caber a fala (nunca encolhe abaixo do mínimo SEG.*).
export interface DuracoesCena {
  intro?: number;
  cta?: number;
  final?: number;
}

// Monta a lista de blocos em sequência. Cada produto ganha seu próprio slot.
// duracoesProduto (opcional, segundos por produto) e duracoesCena (intro/cta/final):
// quando há narração, cada cena se ajusta pra caber a fala (mínimo SEG.*).
export function montarBlocos(
  qtdProdutos: number,
  duracoesProduto?: number[],
  duracoesCena?: DuracoesCena,
): Bloco[] {
  // 1) Durações de cada cena.
  const base: Omit<Bloco, 'from'>[] = [];
  base.push({ tipo: 'intro', durationInFrames: sToF(Math.max(SEG.intro, duracoesCena?.intro ?? 0)) });
  for (let i = 0; i < qtdProdutos; i++) {
    base.push({
      tipo: 'produto',
      durationInFrames: sToF(Math.max(SEG.produto, duracoesProduto?.[i] ?? SEG.produto)),
      indiceProduto: i,
    });
  }
  base.push({ tipo: 'cta', durationInFrames: sToF(Math.max(SEG.cta, duracoesCena?.cta ?? 0)) });
  base.push({ tipo: 'final', durationInFrames: sToF(Math.max(SEG.final, duracoesCena?.final ?? 0)) });

  // 2) `from` considera a SOBREPOSIÇÃO das transições: cada transição puxa a cena
  //    seguinte DUR_TRANSICAO frames pra trás (usado pra sincronizar a narração).
  let cursor = 0;
  return base.map((b, i) => {
    const from = cursor;
    cursor += b.durationInFrames - (i < base.length - 1 ? DUR_TRANSICAO : 0);
    return { ...b, from };
  });
}

export function duracaoTotalEmFrames(
  qtdProdutos: number,
  duracoesProduto?: number[],
  duracoesCena?: DuracoesCena,
): number {
  const b = montarBlocos(qtdProdutos, duracoesProduto, duracoesCena);
  const soma = b.reduce((t, x) => t + x.durationInFrames, 0);
  return soma - Math.max(0, b.length - 1) * DUR_TRANSICAO;
}
