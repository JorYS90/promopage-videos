const express = require('express');
const { buscarMelhorImagem, baixarLocal } = require('./busca-orquestrador');
const { gerarPlaceholderSVG } = require('./busca-imagens');
const config = require('./config');

const router = express.Router();

function abs(u) {
  if (!u) return u;
  if (/^https?:\/\//.test(u)) return u;
  return config.PUBLIC_BASE_URL + u;
}

// Busca a melhor imagem pra cada nome de produto (auto-foto).
router.post('/api/produtos/buscar-imagens', async (req, res) => {
  const nomes = Array.isArray(req.body.nomes) ? req.body.nomes : [];
  if (!nomes.length) return res.json({ resultados: [] });
  const resultados = await Promise.all(
    nomes.map(async (nome) => {
      try {
        const r = await buscarMelhorImagem(String(nome));
        return { nome, imagem: abs(r.imagem), fonte: r.fonte };
      } catch (e) {
        return { nome, imagem: null, fonte: 'erro', erro: e.message };
      }
    }),
  );
  res.json({ resultados });
});

// Baixa uma URL externa pro /uploads local (escolha manual de imagem).
router.get('/api/produtos/proxy-imagem', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ erro: 'url obrigatória' });
  try {
    const local = await baixarLocal(String(url));
    res.json({ url: abs(local) });
  } catch (e) {
    res.status(502).json({ erro: e.message });
  }
});

// Placeholder SVG estilizado (quando nenhuma fonte retorna imagem).
router.get('/api/placeholder', (req, res) => {
  const svg = gerarPlaceholderSVG(req.query.nome || '', req.query.paleta || 'vermelho');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

module.exports = router;
