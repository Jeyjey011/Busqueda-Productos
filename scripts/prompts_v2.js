// Genera datos/empaques/prompts_v2.json: 3 indicaciones por marca recomendada (logo, envase, foto de uso).
// El envase usa el logo generado como referencia y la foto de uso usa el envase.
// Uso: node scripts/prompts_v2.js
const fs = require('fs'); const path = require('path');
const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, 'datos', 'marcas_v2');
const registros = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'lineas', 'registros.json'), 'utf8'));
const fin = (s) => String(s || '').trim().replace(/[.;,]?$/, '.');
const out = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  for (const x of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))) {
    const r = registros.find((y) => y.registro === x.registro); const c = x.candidatos[x.recomendada];
    out.push({
      registro: x.registro, nombre: c.nombre,
      logo: `Professional brand identity sheet for a premium supplement brand called "${c.nombre}" (${r.producto}), presented like a top branding agency case study, flat graphic design on a clean background in the brand palette. Top: the primary logo. ${fin(x.logo_en)} Below: the reversed version of the logo, the symbol alone as a monogram, a color palette row of swatches (${(x.paleta || []).join(', ')}), and a flat front label layout for the package. ${fin(x.etiqueta_en)} Tagline in Spanish: "${c.eslogan}". Crisp vector look, generous negative space, perfectly spelled text.`,
      pack: `High-end campaign product photo of the "${c.nombre}" supplement (${r.producto}), using EXACTLY the logo, typography, colors and label design from the attached brand identity sheet. The product: ${fin(x.envase_en)} Label: ${fin(x.etiqueta_en)} Scene: ${fin(x.escena_en)} Photorealistic, editorial, only one product package, sharp and correctly spelled label text.`,
      life: `Instagram/TikTok vertical lifestyle photo, iPhone look, real Colombian setting: ${fin(x.lifestyle_en)} The product is the attached "${c.nombre}" package: keep it exactly as in the reference image (same shape, colors, logo and label). No faces shown. Photorealistic, natural light, slight film grain, sharp correctly spelled label text.`,
    });
  }
}
fs.writeFileSync(path.join(RAIZ, 'datos', 'empaques', 'prompts_v2.json'), JSON.stringify(out, null, 1), 'utf8');
console.log(out.length, 'marcas');
