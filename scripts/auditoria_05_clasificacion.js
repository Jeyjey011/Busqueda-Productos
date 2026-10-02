// Auditoría: clasificación de productos (solo lectura)
const { datos } = require('./auditoria_lib');
const d = datos();
const crudo = new Map([...d.us, ...d.mx, ...d.sem, ...d.nuevos].map((p) => [String(p.product_id), p]));
const asig = d.plan.asignacion;
const fam = new Map(d.plan.familias.map((f) => [f.familia_id, f]));
const VEH = [
  ['Gomita', /gumm|gomit|chewable gum|gummies/i],
  ['Softgel', /softgel|soft gel|c[aá]psulas blandas|perlas/i],
  ['Cápsula', /capsul|c[aá]psul|caps\b|veggie caps/i],
  ['Tableta', /tablet|tableta|comprimid/i],
  ['Polvo', /powder|polvo|drink mix/i],
  ['Gotas', /drops|gotas|gotero|dropper/i],
  ['Líquido/Shot', /liquid|l[ií]quid|shot|syrup|jarabe/i],
  ['Sachet/Stick', /stick|sachet|sobres|packets/i],
];
console.log('=== Vehículo inconsistente con el título');
for (const c of d.clasif.values()) {
  const t = crudo.get(String(c.product_id)).titulo;
  const hits = VEH.filter(([, re]) => re.test(t)).map(([v]) => v);
  if (hits.length && !hits.includes(c.vehiculo)) console.log(`${c.product_id} veh=${c.vehiculo} título sugiere=${hits.join('/')} fam=${asig[c.product_id] || '-'}(${fam.get(asig[c.product_id])?.vehiculo || ''}) | ${t.slice(0, 120)}`);
}
console.log('\n=== Posibles no ingeribles fuera de EXC');
const NOING = /suppositor|supositori|cream|crema|lotion|loci[oó]n|massage|masaje|topical|t[oó]pic|roll-?on|patch|parche|serum|s[eé]rum|shampoo|champ[uú]|toothpaste|spray|external|externo|oil for skin|body oil|balm|b[aá]lsamo|mascarilla|mask|tea bag|t[eé] |infusi[oó]n|coffee|caf[eé] |candy|snack|chocolate/i;
for (const c of d.clasif.values()) {
  const t = crudo.get(String(c.product_id)).titulo;
  if (c.categoria !== 'EXC' && NOING.test(t)) console.log(`${c.product_id} ${c.categoria} ${c.vehiculo} ing=${c.es_ingerible} | ${t.slice(0, 130)}`);
  if (c.es_ingerible === false && c.categoria !== 'EXC') console.log('NO INGERIBLE FUERA DE EXC', c.product_id);
  if (c.categoria === 'EXC' && c.semaforo_invima !== 'N/A') console.log('EXC con semáforo', c.product_id, c.semaforo_invima);
}
console.log('\n=== Referencias "Misma fórmula" en notas que quedaron en otra familia');
for (const c of d.clasif.values()) {
  const txt = `${c.notas || ''} ${c.adaptacion_colombia || ''}`;
  for (const m of txt.matchAll(/(misma f[oó]rmula|mismo producto|duplicad|igual que|id[eé]ntic)[^.]*?(\d{19})/gi)) {
    const otro = m[2];
    if (asig[otro] !== asig[c.product_id]) console.log(`${c.product_id} (${asig[c.product_id] || '-'}) vs ${otro} (${asig[otro] || '-'}): ${m[0].slice(0, 140)}`);
  }
}
console.log('\n=== Mismo título/marca en familias distintas');
const porMarca = {};
for (const c of d.clasif.values()) { const k = (c.formula_base || '').toLowerCase().replace(/[^a-záéíóúñ0-9]/g, ''); (porMarca[k] = porMarca[k] || []).push(c); }
for (const [k, arr] of Object.entries(porMarca)) {
  const fs = new Set(arr.map((c) => asig[c.product_id] || '-'));
  if (arr.length > 1 && fs.size > 1) console.log('Misma formula_base en familias', [...fs], arr.map((c) => c.product_id + ' ' + c.nombre_corto + ' ' + c.vehiculo).join(' || '));
}
console.log('\n=== Campos vacíos en clasificación');
const campos = ['nombre_corto', 'marca', 'categoria', 'subcategoria', 'vehiculo', 'presentacion', 'formula_base', 'para_que_sirve', 'semaforo_invima', 'motivo_semaforo', 'adaptacion_colombia', 'fuente_ingredientes', 'confianza_formula'];
const vac = {};
for (const c of d.clasif.values()) for (const k of campos) if (c[k] == null || c[k] === '' || (Array.isArray(c[k]) && !c[k].length)) (vac[k] = vac[k] || []).push(c.product_id + (c.categoria === 'EXC' ? '(EXC)' : ''));
for (const c of d.clasif.values()) if (!c.ingredientes_clave || !c.ingredientes_clave.length) (vac.ingredientes_clave = vac.ingredientes_clave || []).push(c.product_id + (c.categoria === 'EXC' ? '(EXC)' : ''));
console.log(vac);
console.log('\n=== Valores de dominio');
const cnt = (k) => { const o = {}; for (const c of d.clasif.values()) o[c[k]] = (o[c[k]] || 0) + 1; return o; };
console.log(cnt('vehiculo'), cnt('semaforo_invima'), cnt('confianza_formula'), cnt('categoria'), cnt('fuente_ingredientes'));
console.log('\n=== Familias vacías de ingredientes_a_evitar u otros campos');
for (const f of d.plan.familias) for (const k of Object.keys(f)) if (f[k] === '' || f[k] == null) console.log(f.familia_id, 'vacío:', k);
