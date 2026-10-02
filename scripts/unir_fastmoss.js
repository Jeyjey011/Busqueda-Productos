// Une los rankings de FastMoss en una lista de productos únicos (por product_id)
// y la parte en lotes para los agentes clasificadores.
// Uso: node unir_fastmoss.js [numeroDeLotes]
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, 'datos', 'fastmoss');
const ARCHIVOS = ['us_mensual_2026-09.json', 'mx_mensual_2026-09.json', 'semanal_2026-W39.json', 'nuevos_us_2026-09.json'];
const LOTES = Number(process.argv[2] || 3);

const productos = new Map();
for (const archivo of ARCHIVOS) {
  const ruta = path.join(DIR, archivo);
  if (!fs.existsSync(ruta)) { console.warn('Falta', archivo); continue; }
  for (const p of JSON.parse(fs.readFileSync(ruta, 'utf8'))) {
    const id = String(p.product_id);
    const region = (p.ranking || '').split(' ')[0] || (archivo.includes('_us_') ? 'US' : '');
    const previo = productos.get(id) || { product_id: id, titulo: p.titulo, tienda: p.tienda, region, categoria_l3: p.categoria_l3, rankings: [] };
    previo.rankings.push(`${p.ranking || archivo} #${p.puesto}`);
    productos.set(id, previo);
  }
}

const lista = [...productos.values()];
fs.writeFileSync(path.join(DIR, 'productos_unicos.json'), JSON.stringify(lista, null, 1), 'utf8');
const tam = Math.ceil(lista.length / LOTES);
for (let i = 0; i < LOTES; i++) {
  fs.writeFileSync(path.join(DIR, `lote_${i + 1}.json`), JSON.stringify(lista.slice(i * tam, (i + 1) * tam), null, 1), 'utf8');
}
console.log(`${lista.length} productos únicos en ${LOTES} lotes de hasta ${tam}`);
