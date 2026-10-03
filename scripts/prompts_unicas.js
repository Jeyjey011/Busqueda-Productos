// Genera datos/empaques/prompts_unicas.json: una indicación por marca única (3 por registro),
// con el envase, la etiqueta y la escena que definió cada marca.
// Uso: node scripts/prompts_unicas.js
const fs = require('fs'); const path = require('path');
const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, 'datos', 'marcas_unicas');
const registros = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'lineas', 'registros.json'), 'utf8'));
const marcas = {};
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) for (const x of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))) marcas[x.registro] = x.marcas;
const fin = (s) => String(s || '').trim().replace(/[.;,]?$/, '.');
const prompts = [];
for (const r of registros) {
  const ms = marcas[r.registro];
  if (!ms) { console.warn('Faltan marcas de', r.registro); continue; }
  ms.forEach((b, i) => prompts.push({
    registro: r.registro, n: i + 1, nombre: b.nombre,
    prompt: `Premium e-commerce product photography, photorealistic, shot like a real brand campaign. ${fin(b.escena_en)} Only ONE single product in the image: ${fin(b.envase_en)} Label design: ${fin(b.etiqueta_en)} The label shows the brand name "${b.nombre}" as the big dominant logo and, smaller, the Spanish text "${b.descriptor}". The product is: ${r.producto}. Vertical composition with the product centered and filling most of the frame. Sharp, legible, correctly spelled text; no other words on the label. No people, no hands.`,
  }));
}
fs.writeFileSync(path.join(RAIZ, 'datos', 'empaques', 'prompts_unicas.json'), JSON.stringify(prompts, null, 1), 'utf8');
console.log(prompts.length, 'indicaciones');
