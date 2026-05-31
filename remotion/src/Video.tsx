import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import type { PromoProps } from './lib/types';
import { montarBlocos, DUR_TRANSICAO } from './lib/timeline';
import { getTemplate, themeDoTemplate } from './templates/registry';
import { Fundo } from './areas/Fundo';
import { Intro } from './areas/Intro';
import { Produto } from './areas/Produto';
import { Cta } from './areas/Cta';
import { Final } from './areas/Final';
import { Rodape } from './areas/Rodape';
import { Camadas } from './areas/Camadas';

// Período formatado a partir das datas das regras (DD/MM), quando "mostrar datas".
const fmtData = (iso?: string) => {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : '';
};

const faseDoBloco = (tipo: string): 'intro' | 'produtos' | 'cta' | 'ctaFim' =>
  tipo === 'intro' ? 'intro' : tipo === 'produto' ? 'produtos' : tipo === 'cta' ? 'cta' : 'ctaFim';

// Transição entre cenas: slide enérgico entre produtos, crossfade no resto.
const presentacao = (de: string, para: string) =>
  de === 'produto' && para === 'produto' ? slide({ direction: 'from-right' }) : fade();

export const Video: React.FC<PromoProps> = (props) => {
  const { formato, produtos, empresa, cta, periodo, introTexto, finalTexto, audio, creditoTrilha, regras } = props;
  const sfxOn = props.sfx !== false;
  // Datas das regras viram o texto do período (quando "mostrar datas" estiver ligado).
  const datas = regras?.mostrarDatas && regras.dataInicio && regras.dataFinal
    ? `Ofertas válidas de ${fmtData(regras.dataInicio)} a ${fmtData(regras.dataFinal)}`
    : '';
  const periodoFinal = datas || periodo;
  const { durationInFrames } = useVideoConfig();
  const template = getTemplate(props.templateId);
  const theme = props.tema ?? themeDoTemplate(template);
  const variante = props.tema && props.tema.tipo === 'imagem' ? 'classico' : template.variante;
  const blocos = montarBlocos(produtos.length, props.duracoesProduto, props.duracoesCena);

  const inicioCta = blocos.find((b) => b.tipo === 'cta')?.from ?? 0;
  const inicioFinal = blocos.find((b) => b.tipo === 'final')?.from ?? 0;
  const inicioProdutos = blocos.find((b) => b.tipo === 'produto')?.from ?? 0;

  // Conteúdo de uma cena (fundo + área).
  const cena = (b: (typeof blocos)[number]) => (
    <>
      <Fundo tema={theme} fase={faseDoBloco(b.tipo)} formato={formato} />
      {b.tipo === 'intro' && <Camadas tema={props.tema} formato={formato} />}
      {b.tipo === 'intro' && <Intro theme={theme} empresa={empresa} texto={introTexto} formato={formato} />}
      {b.tipo === 'produto' && (
        <Produto produto={produtos[b.indiceProduto!]} theme={theme} formato={formato} variante={variante} empresa={empresa} />
      )}
      {b.tipo === 'cta' && <Camadas tema={props.tema} formato={formato} />}
      {b.tipo === 'cta' && <Cta theme={theme} cta={cta} periodo={periodoFinal} formato={formato} />}
      {b.tipo === 'final' && <Final theme={theme} empresa={empresa} texto={finalTexto} formato={formato} credito={creditoTrilha} />}
    </>
  );

  // Monta a TransitionSeries intercalando cenas e transições.
  const filhos: React.ReactNode[] = [];
  blocos.forEach((b, i) => {
    filhos.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={b.durationInFrames}>
        {cena(b)}
      </TransitionSeries.Sequence>,
    );
    if (i < blocos.length - 1) {
      filhos.push(
        <TransitionSeries.Transition
          key={`t${i}`}
          timing={linearTiming({ durationInFrames: DUR_TRANSICAO })}
          presentation={presentacao(b.tipo, blocos[i + 1].tipo)}
        />,
      );
    }
  });

  // Ducking dinâmico: a música TOCA CHEIA e só abaixa nas janelas de narração,
  // voltando a encher nos respiros (entre falas, transições, cauda do final).
  const temNarracao = !!(
    audio?.narracaoIntro ||
    audio?.narracaoFinal ||
    audio?.narracaoCta ||
    (audio?.narracaoProdutos && audio.narracaoProdutos.some(Boolean))
  );
  // Janelas [início, fim] em frames onde há voz (música abaixa).
  const janelas: [number, number][] = [];
  const bloco = (tipo: string) => blocos.find((b) => b.tipo === tipo);
  if (audio?.narracaoIntro) { const b = bloco('intro'); if (b) janelas.push([b.from, b.from + b.durationInFrames * 0.9]); }
  blocos.filter((b) => b.tipo === 'produto').forEach((b) => {
    if (audio?.narracaoProdutos?.[b.indiceProduto!]) janelas.push([b.from, b.from + b.durationInFrames]);
  });
  if (audio?.narracaoCta) { const b = bloco('cta'); if (b) janelas.push([b.from, b.from + b.durationInFrames * 0.9]); }
  if (audio?.narracaoFinal) { const b = bloco('final'); if (b) janelas.push([b.from, b.from + b.durationInFrames * 0.9]); }

  const VOL_DUCK = 0.13;                  // sob a narração (+12%)
  const VOL_FULL = temNarracao ? 0.40 : 0.50; // nos respiros / sem narração (+12%)
  const RAMP = 10;                        // frames de transição de volume
  const volTrilha = (f: number) => {
    let alvo = VOL_FULL;
    for (const [a, b] of janelas) {
      if (f >= a - RAMP && f <= b + RAMP) {
        const entra = interpolate(f, [a - RAMP, a], [VOL_FULL, VOL_DUCK], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const sai = interpolate(f, [b, b + RAMP], [VOL_DUCK, VOL_FULL], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        alvo = Math.min(alvo, entra, sai);
      }
    }
    const fadeIn = interpolate(f, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(f, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });
    return Math.max(0, alvo * fadeIn * fadeOut);
  };

  // SFX de impacto: whoosh nas trocas de cena, pop quando o preço "estampa".
  const whooshes = sfxOn ? blocos.slice(1).map((b) => Math.max(0, b.from - 6)) : [];
  const pops = sfxOn
    ? blocos.filter((b) => b.tipo === 'produto').map((b) => b.from + 8) // popPreco entra ~frame 8
    : [];

  return (
    <AbsoluteFill>
      <TransitionSeries>{filhos}</TransitionSeries>

      {/* RODAPÉ — barra de avisos/validade/endereço, só durante as cenas de produto */}
      <Sequence from={inicioProdutos} durationInFrames={Math.max(1, inicioCta - inicioProdutos)}>
        <Rodape regras={regras} empresa={empresa} theme={theme} formato={formato} />
      </Sequence>

      {/* SFX — whoosh nas trocas de cena, pop na estampa do preço */}
      {whooshes.map((f, i) => (
        <Sequence key={`wh${i}`} from={f} durationInFrames={20}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.34} />
        </Sequence>
      ))}
      {pops.map((f, i) => (
        <Sequence key={`pp${i}`} from={f} durationInFrames={12}>
          <Audio src={staticFile('sfx/pop.wav')} volume={0.43} />
        </Sequence>
      ))}

      {/* TRILHA — música de fundo (loop), abaixada sob a narração */}
      {audio?.trilha && <Audio src={audio.trilha} volume={volTrilha} loop />}
      {/* NARRAÇÃO */}
      {audio?.narracaoIntro && (
        <Sequence from={0}>
          <Audio src={audio.narracaoIntro} volume={1} />
        </Sequence>
      )}
      {audio?.narracaoProdutos &&
        blocos
          .filter((b) => b.tipo === 'produto')
          .map((b) =>
            audio.narracaoProdutos![b.indiceProduto!] ? (
              <Sequence key={`np-${b.indiceProduto}`} from={b.from}>
                <Audio src={audio.narracaoProdutos![b.indiceProduto!]!} volume={1} />
              </Sequence>
            ) : null,
          )}
      {audio?.narracaoCta && (
        <Sequence from={inicioCta}>
          <Audio src={audio.narracaoCta} volume={1} />
        </Sequence>
      )}
      {audio?.narracaoFinal && (
        <Sequence from={inicioFinal}>
          <Audio src={audio.narracaoFinal} volume={1} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
