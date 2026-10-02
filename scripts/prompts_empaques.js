// Genera datos/empaques/prompts.json: una indicación por registro para la foto con los 3 envases de sus marcas.
const fs = require('fs'); const path = require('path');
const RAIZ = path.join(__dirname, '..');
const pw = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'plan_web.json'), 'utf8'));
const nuevosReg = fs.existsSync(path.join(RAIZ, 'datos', 'registros_nuevos.json')) ? JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'registros_nuevos.json'), 'utf8')) : [];
const R = Object.fromEntries([...pw.registros, ...nuevosReg].map((r) => [r.id, r]));
const dir = path.join(RAIZ, 'datos', 'marcas_registros');
const todos = [...fs.readdirSync(dir).flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))), ...nuevosReg.map((n) => ({ registro: n.id, marcas: n.marcas }))];
const ENVASE = {
  'Cápsula': 'a white supplement bottle with capsules', 'Cápsula blanda': 'an amber supplement bottle with softgels', 'Tableta': 'a supplement bottle with tablets',
  'Gomita': 'a supplement jar of colorful gummies', 'Polvo': 'a large supplement powder tub', 'Sobre / stick': 'a retail box of single-serve powder stick sachets',
  'Gotas': 'an amber glass dropper bottle', 'Líquido': 'a liquid supplement bottle', 'Té': 'a retail box of tea bags', 'Otro': 'a stand-up supplement pouch',
};
const prompts = todos.map((r) => {
  const g = R[r.registro]; const env = ENVASE[g.presentacion] || 'a supplement bottle'; const n = r.marcas.map((b) => b.nombre);
  if (n.length === 1) return { registro: r.registro, presentacion: g.presentacion, marcas: n, prompt: `Professional e-commerce product photograph, photorealistic, studio lighting on a clean light gray background with soft shadows. One real supplement product: ${env}, with gummies shaped like little bears. The label clearly reads "${n[0]}" and a smaller line in Spanish reads "${g.beneficio}". Product: ${g.nombre}. Realistic printed packaging like a real product sold in a pharmacy, sharp legible text with correct Spanish spelling. No people, no hands, no extra words.` };
  return {
    registro: r.registro, presentacion: g.presentacion, marcas: n,
    prompt: `Professional e-commerce product photograph, photorealistic, studio lighting on a clean light gray background with soft shadows. Three different real supplement products of three different brands standing side by side, each one is ${env}, each with its own distinct label design and color palette. The left product label clearly reads "${n[0]}", the center product label clearly reads "${n[1]}", the right product label clearly reads "${n[2]}". Under each brand name, a smaller line in Spanish reads "${g.beneficio}". The products are: ${g.nombre}. Realistic printed packaging like real products sold in a pharmacy, sharp legible text with correct Spanish spelling. No people, no hands, no extra words.`,
  };
});
fs.mkdirSync(path.join(RAIZ, 'datos', 'empaques'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'datos', 'empaques', 'prompts.json'), JSON.stringify(prompts, null, 1), 'utf8');
console.log(prompts.length, 'indicaciones');
