# Promopage Videos

Geração automática de **vídeos promocionais comerciais** a partir de templates,
produtos, preços e imagens — extensão do site [PromoPage](https://promopage.com.br).

Mesma stack do PromoPage (Encarte Builder) pra facilitar integração futura:
**React + Vite** (frontend) · **Node/Express** (backend) · **Remotion** (render de vídeo).

```
Promopage Videos/
├── backend/      API Express (jobs, upload, fila, render). Porta 4020.
├── remotion/     Projeto Remotion: compositions, AREAS, templates, autofit, timeline.
└── frontend/     Wizard React+Vite com a identidade visual do PromoPage. Porta 5175.
```

> Portas escolhidas pra não colidir: CRM VENDA+ usa 4000, Encarte Builder usa 4010/5173.
> Este projeto usa **backend 4020** e **frontend 5175**.

## Como rodar (dev)

São 3 `npm install` (um por pasta) e 2 processos rodando.

> ⚠️ O `remotion/` PRECISA de `npm install` mesmo que você não use o Studio:
> o backend faz o *bundle* desse projeto na hora de renderizar e resolve os
> módulos a partir de `remotion/node_modules`. Sem isso, o render falha com
> "Module not found".

```bash
# 0) Dependências do projeto Remotion (obrigatório p/ o render)
cd remotion && npm install

# 1) Backend (API + render)
cd backend
npm install
cp .env.example .env      # ajuste se for usar OpenAI/ElevenLabs
npm run dev               # http://localhost:4020

# 2) Frontend
cd frontend
npm install
npm run dev               # http://localhost:5175  (proxy /api -> 4020)
```

Para abrir o **Remotion Studio** (preview/edição visual dos templates):

```bash
cd remotion
npm run dev               # abre o Studio no navegador
```

> Na **primeira renderização** o Remotion baixa um Chromium headless
> (~150 MB) automaticamente — pode demorar alguns minutos só nessa vez.

## Fluxo

1. Usuário escolhe **formato** (vertical 1080x1920 / horizontal 1920x1080 / quadrado 1080x1080),
   **segmento/estilo** (supermercado, farmácia, adega, petshop, perfumaria) e **quantidade de produtos** (3–7).
2. Preenche nome da loja + logo, e cada produto (nome, preço, imagem, CTA, validade).
3. Backend cria um **job**, processa numa **fila** e renderiza com Remotion (`@remotion/renderer`).
4. Frontend faz **polling** do status e libera o **preview/download** do `.mp4`.

A **timeline se ajusta automaticamente** à quantidade de produtos (ver `remotion/src/lib/timeline.ts`).
Os textos usam **autofit** (reduz fonte + quebra de linha) pra nunca estourar o template
(`remotion/src/lib/autofit.ts`), respeitando safe areas de Reels/Stories.

## Decisões de stack (ajustes ao prompt original)

| Prompt original | Aqui | Por quê |
|---|---|---|
| Next.js | React+Vite + Express separados | Igual ao PromoPage → integra fácil depois |
| Redis + BullMQ | Fila in-process (interface plugável) | Sem infra extra no MVP; troca sem refatorar |
| Cloudflare R2 / B2 | Disco local (configurável por env) | Mesmo padrão env-configurável do PromoPage |
| OpenAI / ElevenLabs obrigatórios | Opcionais por env | Funciona 100% sem eles ("mais escrito que narrado") |
| Remotion | **Mantido** | Ferramenta certa pra render programático |

## IA opcional (por env, em `backend/.env`)

- `OPENAI_API_KEY` — gera/melhora textos de CTA e chamadas (intro/encerramento). Sem a chave, usa textos padrão.
- `ELEVENLABS_API_KEY` — narração de intro/encerramento/CTA. Sem a chave, vídeo fica 100% escrito.

## Armazenamento

- **Dev:** `backend/uploads` (imagens) e `backend/out` (mp4 renderizado).
- **Prod:** definir `STORAGE_DRIVER=r2|b2` + credenciais no `.env` (driver a implementar quando for pro deploy).
