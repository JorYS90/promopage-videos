import React from 'react';
import { Composition } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Video } from './Video';
import type { PromoProps } from './lib/types';
import { promoSchema } from './lib/schema';
import { DIMENSOES } from './lib/formato';
import { FPS, duracaoTotalEmFrames } from './lib/timeline';
import { templatePadraoPara } from './templates/registry';

// Dimensão e duração derivam das props (formato + qtd de produtos).
const calcular: CalculateMetadataFunction<PromoProps> = ({ props }) => {
  const dim = DIMENSOES[props.formato] ?? DIMENSOES.vertical;
  return {
    width: dim.width,
    height: dim.height,
    fps: FPS,
    durationInFrames: duracaoTotalEmFrames(props.produtos.length, props.duracoesProduto, props.duracoesCena),
  };
};

// Props de exemplo (aparecem no Remotion Studio).
const exemplo: PromoProps = {
  formato: 'vertical',
  segmento: 'supermercado',
  templateId: templatePadraoPara('supermercado').id,
  empresa: { nome: 'Supermercado São Marcos' },
  produtos: [
    { nome: 'Arroz Tipo 1 5kg', preco: '19,90', precoDe: '27,90', unidade: 'pct' },
    { nome: 'Coca-Cola 2L', preco: '7,49', unidade: 'un' },
    { nome: 'Café Torrado 500g', preco: '12,99', precoDe: '16,90' },
    { nome: 'Leite Integral 1L', preco: '3,79', unidade: 'cada', info: 'Leve 6 e pague 5' },
  ],
  cta: 'Corre aproveitar!',
  periodo: 'Ofertas válidas só até domingo',
  introTexto: 'Ofertas da semana no Supermercado São Marcos',
  finalTexto: 'Venha conferir nossa loja',
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Promo"
      component={Video}
      schema={promoSchema}
      defaultProps={exemplo}
      calculateMetadata={calcular}
      // Valores iniciais; sobrescritos por calculateMetadata.
      durationInFrames={duracaoTotalEmFrames(exemplo.produtos.length)}
      fps={FPS}
      width={DIMENSOES.vertical.width}
      height={DIMENSOES.vertical.height}
    />
  );
};
