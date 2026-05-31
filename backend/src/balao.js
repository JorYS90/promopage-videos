// Detecta a ÁREA BRANCA INTERNA de um balão (PNG) — onde o preço deve ficar.
// Ignora a borda colorida e o "rabicho", olhando só os pixels claros e opacos.
// Retorna { x, y, w, h } em fração (0..1) da imagem, ou null se não der.
const fs = require('fs');
const { PNG } = require('pngjs');

function analisarBalaoInterior(filePath) {
  try {
    const png = PNG.sync.read(fs.readFileSync(filePath));
    const { width, height, data } = png;
    let minX = width, minY = height, maxX = 0, maxY = 0, count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        // branco/claro opaco (interior), descartando borda vermelha e transparência
        if (a > 200 && r > 175 && g > 175 && b > 175) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          count++;
        }
      }
    }
    if (count < 50 || maxX <= minX || maxY <= minY) return null;
    // pequena folga pra não encostar na borda
    const fx = (maxX - minX) * 0.05;
    const fy = (maxY - minY) * 0.05;
    return {
      x: Math.max(0, (minX + fx) / width),
      y: Math.max(0, (minY + fy) / height),
      w: Math.min(1, (maxX - minX - 2 * fx) / width),
      h: Math.min(1, (maxY - minY - 2 * fy) / height),
    };
  } catch {
    return null;
  }
}

module.exports = { analisarBalaoInterior };
