// Une las 3 fotos de marca de cada registro (marca 1 | 2 | 3) en una imagen 16:9:
// salida/empaques/<registro>.jpg (1024 px) y m_<registro>.jpg (480 px). Las fotos sueltas quedan en salida/empaques_unicas.
// Uso: node scripts/componer_triptico.js
const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const RAIZ = path.join(__dirname, '..');
const DIR_M = path.join(RAIZ, 'salida', 'empaques_unicas');
const DIR_E = path.join(RAIZ, 'salida', 'empaques');
const registros = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'lineas', 'registros.json'), 'utf8')).map((r) => r.registro);
(async () => {
  let ok = 0; const faltan = [];
  for (const id of registros) {
    const fotos = [1, 2, 3].map((m) => path.join(DIR_M, `${id}_${m}.jpg`));
    if (!fotos.every((f) => fs.existsSync(f))) { faltan.push(id); continue; }
    const W = 1024, H = 576, w = Math.floor(W / 3);
    const piezas = await Promise.all(fotos.map((f) => sharp(f).resize(w, H, { fit: 'cover', position: 'centre' }).toBuffer()));
    const img = sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
      .composite(piezas.map((b, i) => ({ input: b, left: i * w + (i === 2 ? W - 3 * w : 0), top: 0 })));
    const buf = await img.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(DIR_E, `${id}.jpg`), buf);
    await sharp(buf).resize(600).jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(DIR_E, `m_${id}.jpg`));
    ok++;
  }
  console.log(`${ok} trípticos · faltan ${faltan.length}${faltan.length ? ': ' + faltan.join(', ') : ''}`);
})();
