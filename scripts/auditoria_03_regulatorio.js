// Auditoría: coherencia regulatoria (solo lectura)
const { datos } = require('./auditoria_lib');
const d = datos();
const fam = new Map(d.plan.familias.map((f) => [f.familia_id, f]));
const ROJOS = {
  ashwagandha: /ashwagandha|withania|ksm-?66|sensoril/i,
  garcinia: /garcinia/i,
  tribulus: /tribulus/i,
  melatonina: /melatonin/i,
  dhea: /\bdhea\b/i,
  yohimbe: /yohimb/i,
  efedra: /ephedr|efedr|ma huang/i,
  kava: /\bkava/i,
  sildenafil: /sildenafil|tadalafil/i,
  nac: /\bNAC\b|acetilciste|acetylcyste/i,
  sibutramina: /sibutram/i,
  kratom: /kratom|mitragyn/i,
};
const textoProd = (c, crudo) => [c.formula_base, ...(c.ingredientes_clave || []), crudo?.titulo || ''].join(' | ');
const crudo = new Map([...d.us, ...d.mx, ...d.sem, ...d.nuevos].map((p) => [String(p.product_id), p]));
console.log('=== Productos con ingrediente Rojo y semáforo Verde/Amarillo');
for (const c of d.clasif.values()) {
  const t = textoProd(c, crudo.get(String(c.product_id)));
  const hits = Object.entries(ROJOS).filter(([, re]) => re.test(t)).map(([k]) => k);
  if (hits.length && c.semaforo_invima !== 'Rojo') {
    const enFormula = Object.entries(ROJOS).filter(([, re]) => re.test([c.formula_base, ...(c.ingredientes_clave || [])].join(' '))).map(([k]) => k);
    console.log(`${c.product_id} [${c.semaforo_invima}] ${c.categoria} ${c.nombre_corto} -> ${hits.join(',')} (en fórmula: ${enFormula.join(',') || 'solo título'}) fam=${d.plan.asignacion[c.product_id]}\n   FB: ${c.formula_base}\n   ING: ${(c.ingredientes_clave || []).join('; ')}\n   MOTIVO: ${c.motivo_semaforo}`);
  }
}
console.log('\n=== Fórmulas propuestas con ingrediente Rojo');
for (const f of d.plan.familias) {
  const hits = Object.entries(ROJOS).filter(([, re]) => re.test(f.formula_propuesta_colombia)).map(([k]) => k);
  if (hits.length) console.log(f.familia_id, hits, f.formula_propuesta_colombia);
}
console.log('\n=== Claims prohibidos en declaraciones sugeridas');
const CLAIMS = /baja(r)? de peso|perder peso|p[eé]rdida de peso|quema|grasa|pr[oó]stata|libido|potencia|sexual|gl[uú]te|curv|cur(a|ar)\b|previen|prevenir|desinflam|inflama|detox|desintox|ph vaginal|vaginal|testosterona|hormonal|glucosa|az[uú]car en sangre|coraz[oó]n|presi[oó]n|colesterol|sueño|dormir|ansiedad|cortisol|inmunidad|adelgaz|apetito|saciedad|metabolismo de las grasas/i;
for (const f of d.plan.familias) {
  const m = f.declaraciones_sugeridas.match(new RegExp(CLAIMS, 'gi'));
  if (m) console.log(f.familia_id, m, '\n   ', f.declaraciones_sugeridas);
}
console.log('\n=== Claims en otros campos visibles al cliente (adaptacion_colombia de productos)');
let n = 0;
for (const c of d.clasif.values()) {
  const m = (c.adaptacion_colombia || '').match(/(claims?|declaraci[oó]n)[^.]*?(baja de peso|quema grasa|pr[oó]stata|libido|gl[uú]teos)/i);
  if (m && !/sin|no |nada|prohib|evitar|quitar|eliminar|retirar/i.test(m[0])) { n++; console.log(c.product_id, m[0]); }
}
console.log('n', n);
console.log('\n=== Semáforo de familia vs semáforos de sus productos');
const por = {};
for (const [id, f] of Object.entries(d.plan.asignacion)) { const c = d.clasif.get(id); (por[f] = por[f] || []).push(c); }
for (const f of d.plan.familias) {
  const m = por[f.familia_id] || []; const cnt = {}; m.forEach((c) => { cnt[c.semaforo_invima] = (cnt[c.semaforo_invima] || 0) + 1; });
  const cats = {}; m.forEach((c) => { cats[c.categoria] = (cats[c.categoria] || 0) + 1; });
  const veh = {}; m.forEach((c) => { veh[c.vehiculo] = (veh[c.vehiculo] || 0) + 1; });
  console.log(f.familia_id, f.semaforo, f.vehiculo, f.categoria, 'P' + f.prioridad, JSON.stringify(cnt), JSON.stringify(cats), JSON.stringify(veh));
}
console.log('\n=== Ingredientes "con límite"/"por confirmar" en fórmulas propuestas con semáforo Verde');
const LIM = { creatina: /creatina/i, biotina: /biotina/i, 'vit A/D/E/K': /vitamina (A|D3?|E|K2?)\b|\bD3\b|\bK2\b/i, cafeína: /cafe[ií]na/i, hierro: /hierro/i, maca: /maca/i, 'L-arginina': /arginina/i, 'té verde': /t[eé] verde/i, moringa: /moringa/i, 'myo-inositol': /inositol/i, triptófano: /tript[oó]fano/i, 'diente de león': /diente de le[oó]n/i };
for (const f of d.plan.familias) {
  const hits = Object.entries(LIM).filter(([, re]) => re.test(f.formula_propuesta_colombia)).map(([k]) => k);
  console.log(f.familia_id, f.semaforo, hits.join(', '));
}
