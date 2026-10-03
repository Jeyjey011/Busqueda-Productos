// Genera datos/empaques/prompts_marcas.json: una indicación por registro y por marca madre (Pispa, Nuara, Garra),
// cada una con la identidad visual de su marca y el envase según la presentación.
// Uso: node scripts/prompts_marcas.js
const fs = require('fs'); const path = require('path');
const RAIZ = path.join(__dirname, '..');
const leer = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const registros = leer('datos/lineas/registros.json');
const lineas = { pispa: leer('datos/lineas/pispa.json'), nuara: leer('datos/lineas/nuara.json'), garra: leer('datos/lineas/garra.json') };

const ESCENA = {
  pispa: 'Premium e-commerce product photography, photorealistic, soft pastel studio set with a light peach background and soft shadows, playful but premium Gen-Z wellness brand aesthetic like Lemme or Bloom Nutrition, colorful and TikTok-viral.',
  nuara: 'Premium editorial product photography, photorealistic, warm natural window light on a sand-colored linen cloth and travertine stone surface with a sprig of dried sage, luxury clean wellness brand aesthetic like Goop, Moon Juice or Arrae, minimal and calm spa mood.',
  garra: 'Premium product photography, photorealistic, dramatic studio light on a dark charcoal concrete background with a subtle orange rim light, bold masculine performance brand aesthetic like ZOA Energy or Hims, strong and disciplined.',
};
const ENVASE = {
  pispa: {
    'Gomita': 'a frosted translucent PET jar with a glossy hot-pink screw cap, filled with pastel heart-shaped gummies visible through it, with a few gummies in front',
    'Cápsula': 'a frosted translucent PET bottle with a glossy hot-pink screw cap and pastel capsules in front',
    'Cápsula blanda': 'a frosted translucent PET bottle with a glossy hot-pink screw cap and shiny golden softgels in front',
    'Tableta': 'a frosted translucent PET bottle with a glossy hot-pink screw cap and pastel tablets in front',
    'Polvo': 'a matte pastel stand-up doypack pouch with a clear window showing pink powder, and a scoop of powder in front',
    'Sobre / stick': 'a pastel retail box full of colorful single-serve stick sachets, with two sticks in front',
    'Gotas': 'a frosted glass dropper bottle with a hot-pink rubber bulb',
    'Líquido': 'a frosted translucent bottle with a hot-pink cap',
    'Té': 'a pastel pink tea box with a few tea bags in front',
    'Otro': 'a matte pastel stand-up pouch',
  },
  nuara: {
    'Gomita': 'an opal white glass jar with a natural light wood lid and a small ceramic dish with gummies',
    'Cápsula': 'an amber glass bottle with a natural wood lid and a few capsules on a small ceramic dish',
    'Cápsula blanda': 'an amber glass bottle with a natural wood lid and golden softgels on a small ceramic dish',
    'Tableta': 'an amber glass bottle with a natural wood lid and tablets on a small ceramic dish',
    'Polvo': 'an amber glass jar with a natural light wood lid and a wooden spoon with powder beside it',
    'Sobre / stick': 'a sand-colored recycled cardboard box with single-serve kraft sachets labeled as daily rituals',
    'Gotas': 'an amber glass dropper bottle with a natural wood collar',
    'Líquido': 'an amber glass bottle with a natural wood cap',
    'Té': 'a sand-colored recycled cardboard tea box with linen tea bags in front',
    'Otro': 'a sand-colored recycled cardboard box',
  },
  garra: {
    'Gomita': 'a robust matte black square jar with a wide black screw cap and dark gummies in front',
    'Cápsula': 'a matte black cylindrical bottle with a black screw cap and a few black capsules in front',
    'Cápsula blanda': 'a matte black cylindrical bottle with a black screw cap and amber softgels in front',
    'Tableta': 'a matte black cylindrical bottle with a black screw cap and tablets in front',
    'Polvo': 'a robust matte black square supplement tub with a wide black screw cap, a metallic seal and a black measuring scoop with powder',
    'Sobre / stick': 'a matte black retail box with black single-serve stick sachets',
    'Gotas': 'a matte black glass dropper bottle with an orange dropper bulb',
    'Líquido': 'a matte black bottle with an orange cap',
    'Té': 'a matte black tea box with black tea bags in front',
    'Otro': 'a matte black pouch',
  },
};
const ETIQUETA = {
  pispa: (l, d) => `Cream (#FFF4EA) label with a big lowercase rounded bold logo "pispa" in hot pink (#FF5FA2) with a subtle holographic shimmer, below it the line name "${l}" in a rounded bold font in lilac (#B89CFF) or sunny yellow (#FFC93C), a tiny cute icon, and small text in Spanish "${d}".`,
  nuara: (l, d, n) => `Textured uncoated cream paper label with an elegant high-contrast serif logo "NUARA" in dark brown (#3B2F2A), below it the line name "${l}" in elegant italic serif in terracotta (#B5654A), a small number "Nº ${n}", thin sage green (#8A9A7B) line details, and small text in Spanish "${d}".`,
  garra: (l, d, n) => `Label with a huge condensed heavy uppercase logo "GARRA" in off-white (#F2EFE9), below it the line name "${l.toUpperCase()}" in condensed bold orange (#FF5A1F), a large code "G-${n}" in monospace font, a single orange accent stripe, and small monospace text in Spanish "${d}".`,
};

const prompts = [];
registros.forEach((r, i) => {
  const n = String(i + 1).padStart(2, '0');
  for (const marca of ['pispa', 'nuara', 'garra']) {
    const l = lineas[marca].find((x) => x.registro === r.registro);
    if (!l) { console.warn('Falta línea', marca, r.registro); continue; }
    const envase = ENVASE[marca][r.presentacion] || ENVASE[marca]['Otro'];
    prompts.push({
      registro: r.registro, marca, nombre: `${marca === 'garra' ? 'GARRA' : marca === 'nuara' ? 'NUARA' : 'pispa'} ${l.linea}`,
      prompt: `${ESCENA[marca]} One single supplement product: ${envase}. ${ETIQUETA[marca](l.linea, l.descriptor, n)} The product is: ${r.producto}. Vertical composition with the product centered and filling most of the frame. Sharp, legible, correctly spelled text. No people, no hands, no extra words.`,
    });
  }
});
fs.mkdirSync(path.join(RAIZ, 'datos', 'empaques'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'datos', 'empaques', 'prompts_marcas.json'), JSON.stringify(prompts, null, 1), 'utf8');
console.log(prompts.length, 'indicaciones');
