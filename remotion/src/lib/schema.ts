import { z } from 'zod';

export const produtoSchema = z.object({
  nome: z.string(),
  preco: z.string(),
  precoDe: z.string().optional(),
  unidade: z.string().optional(),
  imagem: z.string().optional(),
  info: z.string().optional(),
});

export const promoSchema = z.object({
  formato: z.enum(['vertical', 'horizontal', 'quadrado']),
  segmento: z.enum(['supermercado', 'farmacia', 'adega', 'petshop', 'perfumaria']),
  templateId: z.string(),
  empresa: z.object({
    nome: z.string(),
    logo: z.string().optional(),
    logoFundo: z.string().optional(),
    endereco: z.string().optional(),
    telefone: z.string().optional(),
    site: z.string().optional(),
  }),
  produtos: z.array(produtoSchema).min(3).max(7),
  cta: z.string(),
  periodo: z.string(),
  introTexto: z.string(),
  finalTexto: z.string(),
  tema: z.object({}).passthrough().optional(),
  duracoesProduto: z.array(z.number()).optional(),
  duracoesCena: z
    .object({ intro: z.number().optional(), cta: z.number().optional(), final: z.number().optional() })
    .optional(),
  audio: z
    .object({
      trilha: z.string().optional(),
      narracaoIntro: z.string().optional(),
      narracaoProdutos: z.array(z.string().nullable()).optional(),
      narracaoCta: z.string().optional(),
      narracaoFinal: z.string().optional(),
    })
    .optional(),
  creditoTrilha: z.string().optional(),
  sfx: z.boolean().optional(),
  regras: z
    .object({
      dataInicio: z.string().optional(),
      dataFinal: z.string().optional(),
      mostrarDatas: z.boolean().optional(),
      enquantoEstoque: z.boolean().optional(),
      imagensIlustrativas: z.boolean().optional(),
      advertenciaMedicamento: z.boolean().optional(),
      mostrarFrase: z.boolean().optional(),
      frasePromocional: z.string().optional(),
    })
    .optional(),
});
