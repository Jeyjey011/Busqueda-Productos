// Descarga la foto generada de una marca única: salida/empaques_unicas/<registro>_<n>.jpg (alto 900 px).
// Uso: node scripts/descargar_unica.js F01 1 https://url
const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const [, , registro, marca, url] = process.argv;
if (!registro || !marca || !url) { console.error('Uso: node scripts/descargar_unica.js <registro> <n> <url>'); process.exit(1); }
const DIR = path.join(__dirname, '..', 'salida', 'empaques_unicas');
fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  await sharp(Buffer.from(await r.arrayBuffer())).resize(null, 900, { withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(DIR, `${registro}_${marca}.jpg`));
  console.log('ok', registro, marca);
})().catch((e) => { console.error('Falla', registro, marca, e.message); process.exit(1); });
