const { z } = require('zod');
const { SEGMENTOS, getTemplate, templatePadraoPara } = require('./templates');
const { padroesPara } = require('./textos-padrao');

const produtoSchema = z.object({
  nome: z.string().trim().min(1, 'nome do produto é obrigatório'),
  preco: z.string().trim().min(1, 'preço é obrigatório'),
  precoDe: z.string().trim().optional(),
  unidade: z.string().trim().optional(),
  imagem: z.string().trim().url().optional().or(z.literal('')),
  info: z.string().trim().optional(),
});

const jobSchema = z.object({
  formato: z.enum(['vertical', 'horizontal', 'quadrado']).default('vertical'),
  segmento: z.enum(SEGMENTOS).default('supermercado'),
  templateId: z.string().optional(),
  empresa: z.object({
    nome: z.string().trim().min(1, 'nome da empresa é obrigatório'),
    logo: z.string().trim().url().optional().or(z.literal('')),
    logoFundo: z.string().trim().optional(),
    endereco: z.string().trim().optional(),
    telefone: z.string().trim().optional(),
    site: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    instagram: z.string().trim().optional(),
    horario: z.string().trim().optional(),
    dias: z.string().trim().optional(),
  }),
  produtos: z.array(produtoSchema).min(3, 'mínimo 3 produtos').max(7, 'máximo 7 produtos'),
  cta: z.string().trim().optional(),
  periodo: z.string().trim().optional(),
  introTexto: z.string().trim().optional(),
  finalTexto: z.string().trim().optional(),
  tema: z.object({}).passthrough().optional(),
  regras: z
    .object({
      dataInicio: z.string().trim().optional(),
      dataFinal: z.string().trim().optional(),
      mostrarDatas: z.boolean().optional(),
      enquantoEstoque: z.boolean().optional(),
      imagensIlustrativas: z.boolean().optional(),
      advertenciaMedicamento: z.boolean().optional(),
      mostrarFrase: z.boolean().optional(),
      frasePromocional: z.string().trim().optional(),
    })
    .optional(),
});

// Valida e completa o payload com defaults (template do segmento + textos padrão).
// Retorna os inputProps prontos pro Remotion.
function normalizar(body) {
  const dados = jobSchema.parse(body);
  const empresaNome = dados.empresa.nome;
  const padrao = padroesPara(dados.segmento, empresaNome);

  const templateId = dados.templateId
    ? getTemplate(dados.templateId).id
    : templatePadraoPara(dados.segmento).id;

  return {
    formato: dados.formato,
    segmento: dados.segmento,
    templateId,
    empresa: {
      nome: empresaNome,
      logo: dados.empresa.logo || undefined,
      logoFundo: dados.empresa.logoFundo || 'transparente',
      endereco: dados.empresa.endereco || undefined,
      telefone: dados.empresa.telefone || undefined,
      site: dados.empresa.site || undefined,
      whatsapp: dados.empresa.whatsapp || undefined,
      instagram: dados.empresa.instagram || undefined,
      horario: dados.empresa.horario || undefined,
      dias: dados.empresa.dias || undefined,
    },
    produtos: dados.produtos.map((p) => ({
      nome: p.nome,
      preco: p.preco,
      precoDe: p.precoDe || undefined,
      unidade: p.unidade || undefined,
      imagem: p.imagem || undefined,
      info: p.info || undefined,
    })),
    cta: dados.cta || padrao.cta,
    periodo: dados.periodo || padrao.periodo,
    introTexto: dados.introTexto || padrao.intro,
    finalTexto: dados.finalTexto || padrao.final,
    ...(dados.tema ? { tema: dados.tema } : {}),
    ...(dados.regras ? { regras: dados.regras } : {}),
  };
}

module.exports = { jobSchema, normalizar };
