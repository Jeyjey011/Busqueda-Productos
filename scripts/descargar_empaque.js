// Descarga una imagen generada y la guarda como salida/empaques/<registro>.jpg (1024 px) y m_<registro>.jpg (480 px).
// Uso: node scripts/descargar_empaque.js F04 https://url-de-la-imagen
const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const [, , registro, url] = process.argv;
if (!registro || !url) { console.error('Uso: node scripts/descargar_empaque.js <registro> <url>'); process.exit(1); }
const DIR = path.join(__dirname, '..', 'salida', 'empaques');
fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  await sharp(buf).resize(1024, null, { withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(DIR, `${registro}.jpg`));
  await sharp(buf).resize(480, null, { withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true }).toFile(path.join(DIR, `m_${registro}.jpg`));
  console.log('ok', registro);
})().catch((e) => { console.error('Falla', registro, e.message); process.exit(1); });
