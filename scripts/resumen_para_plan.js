// Genera datos/fastmoss/para_plan.json: una línea compacta por producto clasificado con su demanda,
// para que el agente planificador agrupe familias sin leer los archivos crudos.
const fs = require('fs'); const path = require('path');
const RAIZ = path.join(__dirname, '..'); const DIR = path.join(RAIZ, 'datos', 'fastmoss');
const TASA_MXN = 18.5;
const crudos = ['us_mensual_2026-09.json', 'mx_mensual_2026-09.json', 'semanal_2026-W39.json'].flatMap((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
const mes = new Map(); const sem = new Map();
for (const p of crudos) (p.ranking.includes('mensual') ? mes : sem).set(String(p.product_id), p);
const salida = [];
for (const f of fs.readdirSync(DIR).filter((f) => /^clasificado_lote_\d+\.json$/.test(f)).sort()) {
  for (const c of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))) {
    const m = mes.get(String(c.product_id)); const s = sem.get(String(c.product_id)); const ref = m || s;
    salida.push({
      product_id: String(c.product_id), mercado: ref ? ref.ranking.split(' ')[0] : 'US', nombre: c.nombre_corto, marca: c.marca,
      ingerible: c.es_ingerible, categoria: c.categoria, subcategoria: c.subcategoria, vehiculo: c.vehiculo, formula_base: c.formula_base,
      ingredientes: c.ingredientes_clave, semaforo: c.semaforo_invima, adaptacion: c.adaptacion_colombia, confianza: c.confianza_formula,
      unidades_sep: m ? m.unidades_periodo : null, gmv_sep_usd: m ? Math.round(m.moneda === 'MXN' ? m.gmv_periodo / TASA_MXN : m.gmv_periodo) : null,
      unidades_sem39: s ? s.unidades_periodo : null, crecimiento_pct: m ? m.crecimiento_pct : null,
    });
  }
}
salida.sort((a, b) => (b.gmv_sep_usd || 0) - (a.gmv_sep_usd || 0));
fs.writeFileSync(path.join(DIR, 'para_plan.json'), JSON.stringify(salida, null, 1), 'utf8');
console.log(salida.length, 'productos en para_plan.json');
