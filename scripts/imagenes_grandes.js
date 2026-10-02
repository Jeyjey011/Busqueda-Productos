// Descarga las imágenes de producto en 520 px para la web (se amplían al tocarlas).
const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, 'salida', 'cache_imagenes_web');
fs.mkdirSync(DIR, { recursive: true });
const crudos = ['us_mensual_2026-09.json', 'mx_mensual_2026-09.json', 'semanal_2026-W39.json', 'nuevos_us_2026-09.json']
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'fastmoss', f), 'utf8')));
const urls = new Map(); crudos.forEach((p) => p.url_imagen && urls.set(String(p.product_id), p.url_imagen));
(async () => {
  const lista = [...urls]; let ok = 0, fallo = 0;
  for (let i = 0; i < lista.length; i += 8) {
    await Promise.all(lista.slice(i, i + 8).map(async ([id, url]) => {
      const ruta = path.join(DIR, `${id}.jpg`);
      if (fs.existsSync(ruta)) return ok++;
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error(r.status);
        await sharp(Buffer.from(await r.arrayBuffer())).resize(520, 520, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).jpeg({ quality: 74, mozjpeg: true }).toFile(ruta); ok++;
      } catch (e) { fallo++; console.warn('Falla', id, e.message); }
    }));
  }
  const total = fs.readdirSync(DIR).reduce((s, f) => s + fs.statSync(path.join(DIR, f)).size, 0);
  console.log(`${ok} imágenes, ${fallo} fallas, ${(total / 1048576).toFixed(1)} MB`);
})();
