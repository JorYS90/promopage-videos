// Parser de lista de produtos — réplica do promopage (Encarte Builder).
// Aceita "Nome 14,99 kg", "Nome R$ 14,99", "Nome R$ X por R$ Y", etc.
// Retorna produtos no formato do app de vídeo (unidade = abreviação).

const MAPA_UNIDADES = {
  kg: { abrev: 'kg', nome: 'Kilo' }, kilo: { abrev: 'kg', nome: 'Kilo' }, kilos: { abrev: 'kg', nome: 'Kilo' },
  quilo: { abrev: 'kg', nome: 'Quilo' }, quilos: { abrev: 'kg', nome: 'Quilo' },
  g: { abrev: 'g', nome: 'Grama' }, gr: { abrev: 'g', nome: 'Grama' }, grama: { abrev: 'g', nome: 'Grama' }, gramas: { abrev: 'g', nome: 'Grama' },
  '100g': { abrev: '100g', nome: '100 Gramas' },
  l: { abrev: 'L', nome: 'Litro' }, lt: { abrev: 'L', nome: 'Litro' }, litro: { abrev: 'L', nome: 'Litro' }, litros: { abrev: 'L', nome: 'Litro' },
  ml: { abrev: 'ml', nome: 'Ml' }, mililitro: { abrev: 'ml', nome: 'Ml' },
  un: { abrev: 'un', nome: 'Unidade' }, und: { abrev: 'un', nome: 'Unidade' }, unid: { abrev: 'un', nome: 'Unidade' },
  unidade: { abrev: 'un', nome: 'Unidade' }, unidades: { abrev: 'un', nome: 'Unidade' },
  dz: { abrev: 'dz', nome: 'Dúzia' }, duzia: { abrev: 'dz', nome: 'Dúzia' }, duzias: { abrev: 'dz', nome: 'Dúzia' }, dúzia: { abrev: 'dz', nome: 'Dúzia' }, dúzias: { abrev: 'dz', nome: 'Dúzia' },
  cento: { abrev: 'cto', nome: 'Cento' }, cto: { abrev: 'cto', nome: 'Cento' },
  cx: { abrev: 'cx', nome: 'Caixa' }, caixa: { abrev: 'cx', nome: 'Caixa' }, caixas: { abrev: 'cx', nome: 'Caixa' },
  pct: { abrev: 'pct', nome: 'Pacote' }, pacote: { abrev: 'pct', nome: 'Pacote' }, pacotes: { abrev: 'pct', nome: 'Pacote' },
  lata: { abrev: 'lt', nome: 'Lata' }, latas: { abrev: 'lt', nome: 'Lata' },
  garrafa: { abrev: 'grf', nome: 'Garrafa' }, garrafas: { abrev: 'grf', nome: 'Garrafa' }, grf: { abrev: 'grf', nome: 'Garrafa' },
  bandeja: { abrev: 'bdj', nome: 'Bandeja' }, bdj: { abrev: 'bdj', nome: 'Bandeja' },
  sache: { abrev: 'sch', nome: 'Sachê' }, sachê: { abrev: 'sch', nome: 'Sachê' },
  saco: { abrev: 'sc', nome: 'Saco' }, sacos: { abrev: 'sc', nome: 'Saco' }, sc: { abrev: 'sc', nome: 'Saco' },
  fardo: { abrev: 'fd', nome: 'Fardo' }, fd: { abrev: 'fd', nome: 'Fardo' },
  pote: { abrev: 'pt', nome: 'Pote' }, potes: { abrev: 'pt', nome: 'Pote' },
  balde: { abrev: 'bld', nome: 'Balde' }, rolo: { abrev: 'rl', nome: 'Rolo' },
  par: { abrev: 'par', nome: 'Par' }, pc: { abrev: 'pç', nome: 'Peça' }, peca: { abrev: 'pç', nome: 'Peça' }, peça: { abrev: 'pç', nome: 'Peça' },
  fatia: { abrev: 'ft', nome: 'Fatia' }, fatias: { abrev: 'ft', nome: 'Fatia' },
  maco: { abrev: 'mç', nome: 'Maço' }, maço: { abrev: 'mç', nome: 'Maço' },
  kit: { abrev: 'kit', nome: 'Kit' }, kits: { abrev: 'kit', nome: 'Kit' },
  combo: { abrev: 'cb', nome: 'Combo' }, cada: { abrev: 'cd', nome: 'Cada' },
  m: { abrev: 'm', nome: 'Metro' }, cm: { abrev: 'cm', nome: 'Centímetro' },
};

function detectarUnidade(texto) {
  const palavras = texto.trim().split(/\s+/);
  if (palavras.length === 0) return { abrev: null, textoLimpo: texto };
  const ultima = palavras[palavras.length - 1].toLowerCase();
  const dados = MAPA_UNIDADES[ultima];
  if (dados) return { abrev: dados.abrev, textoLimpo: palavras.slice(0, -1).join(' ').trim() };
  return { abrev: null, textoLimpo: texto };
}

function parsearLinha(linha) {
  let texto = (linha || '').trim();
  if (!texto) return null;

  const { abrev, textoLimpo } = detectarUnidade(texto);
  if (abrev) texto = textoLimpo;

  // "Nome [de] R$ 4,99 por R$ 3,99" — remove um "de" solto antes do preço
  let m = texto.match(/^(.+?)\s+r?\$?\s*(\d+[.,]?\d*)\s+por\s+r?\$?\s*(\d+[.,]?\d*)\s*$/i);
  if (m) return { nome: m[1].trim().replace(/\s+de$/i, ''), precoDe: m[2].replace('.', ','), preco: m[3].replace('.', ','), unidade: abrev || '' };

  // "Nome R$ 4,99" ou "Nome 4,99"
  m = texto.match(/^(.+?)\s+r?\$?\s*(\d+[.,]\d{2})\s*$/i);
  if (m) return { nome: m[1].trim(), preco: m[2].replace('.', ','), precoDe: '', unidade: abrev || '' };

  // Só nome
  return { nome: texto, preco: '', precoDe: '', unidade: abrev || '' };
}

export function parsearLista(texto) {
  return (texto || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parsearLinha)
    .filter(Boolean)
    .map((p) => ({
      nome: p.nome,
      preco: p.preco,
      precoDe: p.precoDe,
      unidade: p.unidade,
      info: '',
      imagem: '',
      fundoRemovido: false,
      maioresDe18: false,
    }));
}
