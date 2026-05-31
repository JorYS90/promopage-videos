// Remoção de fundo HÍBRIDA (port do PromoPage):
//  1. Chroma key (flood-fill das bordas) — instantâneo, perfeito p/ fundo branco/cinza
//     de catálogo; preserva 100% do produto, com núcleo protegido + hole-fill + erosão.
//  2. IA (@imgly) como fallback quando o fundo não é uniforme. Modelo escolhível:
//     'precise' (isnet, ~160MB, melhor em detalhes) ou 'fast' (isnet_fp16, ~80MB).
//
// API: removerFundo(urlOuBlob, opts) -> Blob (ou null se pularIA e chroma falhar).
//   opts: { forcarIA, pularIA, modeloIA:'fast'|'precise', onProgress, tolerancia, ... }

let removeBackgroundFn = null;
async function carregarIA() {
  if (removeBackgroundFn) return removeBackgroundFn;
  const mod = await import('@imgly/background-removal');
  removeBackgroundFn = mod.removeBackground;
  return removeBackgroundFn;
}

function blobParaImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
const canvasParaBlob = (canvas) => new Promise((r) => canvas.toBlob(r, 'image/png', 1));

function analisarFundo(ctx, w, h) {
  const amostras = [];
  const passo = Math.max(1, Math.floor(Math.min(w, h) / 50));
  for (let x = 0; x < w; x += passo) {
    amostras.push(ctx.getImageData(x, 0, 1, 1).data);
    amostras.push(ctx.getImageData(x, h - 1, 1, 1).data);
  }
  for (let y = 0; y < h; y += passo) {
    amostras.push(ctx.getImageData(0, y, 1, 1).data);
    amostras.push(ctx.getImageData(w - 1, y, 1, 1).data);
  }
  let sumR = 0, sumG = 0, sumB = 0;
  for (const a of amostras) { sumR += a[0]; sumG += a[1]; sumB += a[2]; }
  const n = amostras.length;
  const r = sumR / n, g = sumG / n, b = sumB / n;
  let varTotal = 0;
  for (const a of amostras) varTotal += Math.abs(a[0] - r) + Math.abs(a[1] - g) + Math.abs(a[2] - b);
  return { r, g, b, variacao: varTotal / n, claro: (r + g + b) / 3 > 200 };
}

async function removerFundoChromaKey(blob, opts = {}) {
  const img = await blobParaImage(blob);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const fundo = analisarFundo(ctx, W, H);
  if (fundo.variacao > 25) return { sucesso: false, motivo: 'fundo-nao-uniforme', variacao: fundo.variacao };

  const tolBase = opts.tolerancia ?? (fundo.variacao < 5 ? 24 : 18);
  const tolNucleo = opts.tolNucleo ?? Math.max(80, tolBase * 3.5);
  const data = ctx.getImageData(0, 0, W, H);
  const px = data.data;
  const mask = new Uint8Array(W * H); // 0=?,1=fundo,2=produto,3=nucleo

  const distanciaCor = (idx) => {
    const i = idx * 4;
    const dr = px[i] - fundo.r, dg = px[i + 1] - fundo.g, db = px[i + 2] - fundo.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  const ehFundo = (idx, tol) => distanciaCor(idx) <= tol;

  const fila = [];
  for (let x = 0; x < W; x++) { fila.push(x); fila.push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { fila.push(y * W); fila.push(y * W + (W - 1)); }
  let cabeca = 0;
  while (cabeca < fila.length) {
    const idx = fila[cabeca++];
    if (mask[idx]) continue;
    if (ehFundo(idx, tolBase)) {
      mask[idx] = 1;
      const x = idx % W, y = (idx - (idx % W)) / W;
      if (x > 0) fila.push(idx - 1);
      if (x < W - 1) fila.push(idx + 1);
      if (y > 0) fila.push(idx - W);
      if (y < H - 1) fila.push(idx + W);
    } else {
      mask[idx] = distanciaCor(idx) > tolNucleo ? 3 : 2;
    }
  }

  const tolExpansao = opts.tolerancia2 ?? Math.max(28, tolBase * 1.3);
  const passesExpansao = opts.passesExpansao ?? 1;
  for (let p = 0; p < passesExpansao; p++) {
    let mudou = false;
    const nova = new Uint8Array(mask);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const idx = y * W + x;
      if (mask[idx] !== 2) continue;
      const fv = (mask[idx - 1] === 1) + (mask[idx + 1] === 1) + (mask[idx - W] === 1) + (mask[idx + W] === 1);
      if (fv >= 4 && ehFundo(idx, tolExpansao)) { nova[idx] = 1; mudou = true; }
    }
    mask.set(nova);
    if (!mudou) break;
  }

  const holeFillPasses = opts.holeFillPasses ?? 3;
  for (let p = 0; p < holeFillPasses; p++) {
    let mudou = false;
    const nova = new Uint8Array(mask);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const idx = y * W + x;
      if (mask[idx] !== 1) continue;
      let prod = 0;
      if (mask[idx - W - 1] >= 2) prod++; if (mask[idx - W] >= 2) prod++; if (mask[idx - W + 1] >= 2) prod++;
      if (mask[idx - 1] >= 2) prod++; if (mask[idx + 1] >= 2) prod++;
      if (mask[idx + W - 1] >= 2) prod++; if (mask[idx + W] >= 2) prod++; if (mask[idx + W + 1] >= 2) prod++;
      if (prod >= 6) { nova[idx] = 2; mudou = true; }
    }
    mask.set(nova);
    if (!mudou) break;
  }

  const erosao = opts.erosao ?? 1;
  for (let p = 0; p < erosao; p++) {
    const nova = new Uint8Array(mask);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const idx = y * W + x;
      if (mask[idx] !== 1) continue;
      const pv = (mask[idx - 1] >= 2) + (mask[idx + 1] >= 2) + (mask[idx - W] >= 2) + (mask[idx + W] >= 2);
      if (pv >= 3) nova[idx] = 2;
    }
    mask.set(nova);
  }

  for (let idx = 0; idx < mask.length; idx++) if (mask[idx] === 1) px[idx * 4 + 3] = 0;

  const passes = opts.suavizar ?? 4;
  for (let pass = 0; pass < passes; pass++) {
    const novoAlpha = new Uint8Array(W * H);
    for (let idx = 0; idx < mask.length; idx++) novoAlpha[idx] = px[idx * 4 + 3];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const idx = y * W + x;
      const a = px[idx * 4 + 3];
      if (a === 0) continue;
      const t = (px[(idx - 1) * 4 + 3] < 128) + (px[(idx + 1) * 4 + 3] < 128) + (px[(idx - W) * 4 + 3] < 128) + (px[(idx + W) * 4 + 3] < 128);
      if (t > 0) novoAlpha[idx] = Math.round(a * (1 - t * 0.10));
    }
    for (let idx = 0; idx < mask.length; idx++) px[idx * 4 + 3] = novoAlpha[idx];
  }

  ctx.putImageData(data, 0, 0);
  const blobOut = await canvasParaBlob(canvas);
  return { sucesso: true, blob: blobOut, variacao: fundo.variacao };
}

async function removerFundoIA(blob, opts = {}) {
  const removeBackground = await carregarIA();
  const model = opts.modeloIA === 'precise' ? 'isnet' : 'isnet_fp16';
  return removeBackground(blob, { model, output: { format: 'image/png', quality: 1 }, progress: opts.onProgress });
}

export async function removerFundo(urlOuBlob, opts = {}) {
  let blob = urlOuBlob;
  if (typeof urlOuBlob === 'string') {
    const r = await fetch(urlOuBlob);
    blob = await r.blob();
  }

  if (!opts.forcarIA) {
    try {
      opts.onProgress?.('chroma_key', 0, 100);
      const ck = await removerFundoChromaKey(blob, opts);
      if (ck.sucesso) { opts.onProgress?.('chroma_key', 100, 100); return ck.blob; }
      if (opts.pularIA) return null;
    } catch (e) {
      if (opts.pularIA) return null;
    }
  }
  return removerFundoIA(blob, opts);
}
