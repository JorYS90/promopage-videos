// IA de texto (OpenAI) — OPCIONAL. Sem OPENAI_API_KEY, retorna os textos
// recebidos sem alteração. Gera CTA + chamadas de abertura/encerramento curtas
// e comerciais. Nunca derruba o render: erro = mantém os textos atuais.
const { OPENAI_API_KEY, OPENAI_MODEL } = require('../config');

async function enriquecerTextos(props) {
  if (!OPENAI_API_KEY) return props;

  const nomes = props.produtos.map((p) => p.nome).join(', ');
  const prompt = `Você é redator publicitário de varejo (segmento: ${props.segmento}).
Loja: "${props.empresa.nome}". Produtos em oferta: ${nomes}.
Gere textos curtos, comerciais e em português do Brasil. Responda APENAS JSON:
{"introTexto":"abertura (máx 7 palavras)","finalTexto":"encerramento (máx 6 palavras)","cta":"chamada pra ação (máx 4 palavras)"}`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
    const data = await resp.json();
    const txt = data?.choices?.[0]?.message?.content;
    const json = JSON.parse(txt);
    return {
      ...props,
      introTexto: json.introTexto || props.introTexto,
      finalTexto: json.finalTexto || props.finalTexto,
      cta: json.cta || props.cta,
    };
  } catch (err) {
    console.warn('[ia/texto] falha, mantendo textos padrão:', err.message);
    return props;
  }
}

module.exports = { enriquecerTextos };
