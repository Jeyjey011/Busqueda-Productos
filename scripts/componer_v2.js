// Arma las imágenes de la marca de cada registro a partir de salida/marcas_v2/<registro>_{logo,pack,life}.jpg:
// - portada 16:9 (envase | foto de uso) en salida/empaques/<registro>.jpg y m_<registro>.jpg (la usan la web y el Excel);
// - miniaturas t_<registro>_<tipo>.jpg y versiones grandes g_<registro>_<tipo>.jpg en salida/marcas_v2.
// El magnesio para niños usa la foto real que mandó el cliente (salida/catalogo/magkids.jpg).
// Uso: node scripts/componer_v2.js
const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, 'salida', 'marcas_v2');
const DIR_E = path.join(RAIZ, 'salida', 'empaques');
const registros = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'lineas', 'registros.json'), 'utf8')).map((r) => r.registro);
const REAL = { N6: path.join(RAIZ, 'salida', 'catalogo', 'magkids.jpg') };
const ruta = (id, t) => (t === 'pack' && REAL[id] ? REAL[id] : path.join(DIR, `${id}_${t}.jpg`));

(async () => {
  const faltan = []; let ok = 0;
  for (const id of registros) {
    const tipos = ['logo', 'pack', 'life'].filter((t) => fs.existsSync(ruta(id, t)));
    for (const t of tipos) {
      const f = ruta(id, t);
      await sharp(f).resize(t === 'logo' ? 240 : t === 'pack' ? 320 : 280, t === 'logo' ? 240 : null, { fit: 'cover' }).jpeg({ quality: 70, mozjpeg: true }).toFile(path.join(DIR, `t_${id}_${t}.jpg`));
      await sharp(f).resize(820, 820, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toFile(path.join(DIR, `g_${id}_${t}.jpg`));
    }
    if (!tipos.includes('pack')) { faltan.push(id); continue; }
    // portada: envase a la izquierda y foto de uso a la derecha; si falta la foto de uso, el envase sobre su fondo desenfocado
    const W = 1024, H = 576;
    let base;
    if (tipos.includes('life')) {
      const [a, b] = await Promise.all([ruta(id, 'pack'), ruta(id, 'life')].map((f) => sharp(f).resize(W / 2, H, { fit: 'cover', position: 'centre' }).toBuffer()));
      base = sharp({ create: { width: W, height: H, channels: 3, background: '#111' } }).composite([{ input: a, left: 0, top: 0 }, { input: b, left: W / 2, top: 0 }]);
    } else {
      const fondo = await sharp(ruta(id, 'pack')).resize(W, H, { fit: 'cover' }).blur(28).modulate({ brightness: 0.85 }).toBuffer();
      const frente = await sharp(ruta(id, 'pack')).resize(null, H, { fit: 'inside' }).toBuffer();
      const m = await sharp(frente).metadata();
      base = sharp(fondo).composite([{ input: frente, left: Math.round((W - m.width) / 2), top: 0 }]);
    }
    const buf = await base.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(DIR_E, `${id}.jpg`), buf);
    await sharp(buf).resize(600).jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(DIR_E, `m_${id}.jpg`));
    ok++;
  }
  console.log(`${ok} portadas · faltan ${faltan.length}${faltan.length ? ': ' + faltan.join(', ') : ''}`);
})();
