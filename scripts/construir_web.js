// Genera la web interactiva para Guillermo: salida/web/index.html (una sola página con datos e imágenes embebidos).
// Fuentes: datos FastMoss, clasificación (beneficio), datos/plan_web.json (registros), datos/marcas_registros/*.json
// (3 marcas por registro), datos/marcas/*.json (problema y ganchos por categoría) y datos/duplicados.json.
// Requiere: node scripts/imagenes_grandes.js (fotos en salida/cache_imagenes_web).
// Uso: node scripts/construir_web.js
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIR_FM = path.join(RAIZ, 'datos', 'fastmoss');
const DIR_IMG = path.join(RAIZ, 'salida', 'cache_imagenes_web');
const PLANTILLA = path.join(__dirname, 'web_plantilla.html');
const SALIDA = path.join(RAIZ, 'salida', 'web', 'index.html');
const FIN_PERIODO = new Date('2026-09-30');

const leer = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const existe = (rel) => fs.existsSync(path.join(RAIZ, rel));
const usMes = leer('datos/fastmoss/us_mensual_2026-09.json');
const mxMes = leer('datos/fastmoss/mx_mensual_2026-09.json');
const semanal = leer('datos/fastmoss/semanal_2026-W39.json');
const nuevos = leer('datos/fastmoss/nuevos_us_2026-09.json');
const planWeb = leer('datos/plan_web.json');
const duplicados = existe('datos/duplicados.json') ? leer('datos/duplicados.json').grupos : [];
const clasif = new Map();
for (const f of fs.readdirSync(DIR_FM).filter((f) => /^clasificado_lote_\d+\.json$/.test(f))) {
  for (const c of JSON.parse(fs.readFileSync(path.join(DIR_FM, f), 'utf8'))) clasif.set(String(c.product_id), c);
}
const leerCarpeta = (rel) => (existe(rel) ? fs.readdirSync(path.join(RAIZ, rel)).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel, f), 'utf8'))) : []);
const conceptos = leerCarpeta('datos/marcas'); // un concepto por categoría (problema, ganchos, precio)
const marcasPorRegistro = {};
for (const parte of leerCarpeta('datos/marcas_registros')) for (const r of parte) marcasPorRegistro[r.registro] = r.marcas;

const CATEGORIAS = {
  DIG: 'Digestión, hinchazón y colon', SUE: 'Sueño, estrés y cortisol', ENE: 'Energía, músculo y gym', COL: 'Colágeno y antiedad', SXF: 'Salud íntima y libido femenina',
  PES: 'Quemar grasa y bajar de peso', CAB: 'Cabello, piel y uñas', INM: 'Defensas y vitaminas', COR: 'Circulación y corazón',
  SXM: 'Potencia sexual masculina', PRO: 'Próstata', CER: 'Cerebro y concentración', ART: 'Articulaciones y huesos', BBL: 'Aumentar glúteos y curvas', NIN: 'Niños',
};
const PRES = { Softgel: 'Cápsula blanda', 'Líquido/Shot': 'Líquido', 'Sachet/Stick': 'Sobre / stick', 'Té/Infusión': 'Té' };

// ---------- Publicaciones (listings) ----------
const pub = new Map();
const agregar = (p, region, extra) => {
  const id = String(p.product_id);
  if (!pub.has(id)) pub.set(id, { id, region, titulo: p.titulo, tienda: p.tienda, lanz: p.fecha_lanzamiento, url: p.url_fastmoss });
  Object.assign(pub.get(id), extra);
};
usMes.forEach((p) => agregar(p, 'US', { unid: p.unidades_periodo, crec: p.crecimiento_pct }));
mxMes.forEach((p) => agregar(p, 'MX', { unid: p.unidades_periodo, crec: p.crecimiento_pct }));
semanal.forEach((p) => agregar(p, p.ranking.split(' ')[0], { sem: p.unidades_periodo }));
nuevos.forEach((p) => agregar(p, 'US', {}));

function tendencia(crec, lanz) {
  const d = lanz ? (FIN_PERIODO - new Date(lanz)) / 864e5 : null;
  if (d != null && d <= 90) return 'nuevo';
  if (crec == null) return 'sindato';
  if (crec >= 10) return 'sube';
  if (crec <= -20 && d > 365) return 'quemado';
  if (crec <= -15) return 'baja';
  return 'estable';
}

// ---------- Productos únicos (une duplicados) ----------
const canonDe = new Map();
for (const g of duplicados) for (const id of g.ids) canonDe.set(String(id), String(g.canonico));
const grupos = new Map();
for (const p of pub.values()) {
  const c = clasif.get(p.id) || {};
  if (!c.categoria || c.categoria === 'EXC' || c.es_ingerible === false) continue;
  const k = canonDe.get(p.id) || p.id;
  (grupos.get(k) || grupos.set(k, []).get(k)).push(p);
}
const asignacion = planWeb.asignacion;
const productos = [];
for (const [canon, lista] of grupos) {
  const base = lista.find((p) => p.id === canon) || lista[0];
  const c = clasif.get(base.id) || {};
  const g = duplicados.find((x) => String(x.canonico) === canon);
  const conMes = lista.filter((p) => p.unid != null);
  const u = conMes.length ? conMes.reduce((s, p) => s + p.unid, 0) : null;
  const antes = conMes.reduce((s, p) => s + p.unid / (1 + (p.crec || 0) / 100), 0);
  const crec = conMes.length && antes ? ((u / antes) - 1) * 100 : null;
  const lanz = lista.map((p) => p.lanz).filter(Boolean).sort()[0];
  const sem = lista.some((p) => p.sem != null) ? lista.reduce((s, p) => s + (p.sem || 0), 0) : null;
  productos.push({
    id: canon, n: g?.nombre || c.nombre_corto || base.titulo, m: g?.marca || c.marca || base.tienda,
    paises: [...new Set(lista.map((p) => p.region))], cat: c.categoria,
    v: PRES[c.vehiculo] || c.vehiculo || 'Otro', s: c.beneficio || c.para_que_sirve || '',
    u, w: sem, c: crec == null ? null : Math.round(crec), t: tendencia(crec, lanz),
    f: asignacion[canon] || lista.map((p) => asignacion[p.id]).find(Boolean) || null,
    pubs: lista.length, url: base.url,
  });
}

const yaManejaExtra = {};
// ---------- Productos extra (búsquedas de FastMoss para la línea propia; ventas de 28 días) ----------
const regNuevos = existe('datos/registros_nuevos.json') ? leer('datos/registros_nuevos.json') : [];
const extra = existe('datos/fastmoss/extra_mandar.json') ? leer('datos/fastmoss/extra_mandar.json') : [];
const BUSQUEDA = {
  'melatonin gummies': ['SUE', 'Gomita'], 'melatonina gomitas': ['SUE', 'Gomita'], 'liquid melatonin drops': ['SUE', 'Gotas'],
  'laxative tea': ['DIG', 'Té'], 'kids magnesium gummies': ['NIN', 'Gomita'], 'biotin hair gummies': ['CAB', 'Gomita'],
};
const yaEsta = new Set(productos.map((p) => p.id));
for (const e of extra) {
  const id = String(e.product_id); const tipo = BUSQUEDA[e.busqueda];
  if (!tipo || yaEsta.has(id) || canonDe.has(id)) continue;
  const regs = regNuevos.filter((n) => n.refs.includes(id));
  const reg = regs.find((n) => n.presentacion === tipo[1]) || regs[0];
  if (!reg) continue;
  yaEsta.add(id);
  productos.push({
    id, n: e.titulo.split(/[|–-]/)[0].trim().slice(0, 70), m: e.tienda, paises: [e.region], cat: tipo[0], v: tipo[1],
    s: reg.beneficio, u: e.unidades_28d ?? null, w: null, c: null, t: 'sindato', f: reg.id, pubs: 1, url: e.url_fastmoss, periodo: '28 días',
  });
}

// ---------- Ingredientes: parte la fórmula en "+", ";" o "," de primer nivel ----------
function ingredientes(formula) {
  const partes = []; let nivel = 0, actual = '';
  const t = String(formula || '').replace(/\s+/g, ' ');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '(') nivel++;
    if (ch === ')') nivel = Math.max(0, nivel - 1);
    const corte = nivel === 0 && (ch === ';' || (ch === '+' && t[i - 1] === ' ' && t[i + 1] === ' '));
    if (corte) { partes.push(actual); actual = ''; } else actual += ch;
  }
  partes.push(actual);
  return partes.map((x) => x.trim().replace(/^y\s+/i, '').replace(/\.$/, '')).filter((x) => x.length > 1);
}

// ---------- Registros ----------
const categoriaConcepto = Object.fromEntries(conceptos.map((m) => [m.categoria, m]));
const registros = planWeb.registros.map((f) => {
  const m = productos.filter((p) => p.f === f.id);
  const conMes = m.filter((p) => p.u != null);
  const us = pub.size && [...pub.values()].filter((p) => asignacion[p.id] === f.id && p.region === 'US' && p.unid != null).reduce((s, p) => s + p.unid, 0);
  const mx = [...pub.values()].filter((p) => asignacion[p.id] === f.id && p.region === 'MX' && p.unid != null).reduce((s, p) => s + p.unid, 0);
  const antes = [...pub.values()].filter((p) => asignacion[p.id] === f.id && p.unid != null).reduce((s, p) => s + p.unid / (1 + (p.crec || 0) / 100), 0);
  const crec = antes ? ((us + mx) / antes - 1) * 100 : null;
  const vivos = conMes.filter((p) => p.t !== 'quemado');
  const refs = [...(vivos.length ? vivos : conMes.length ? conMes : m)].sort((a, b) => (b.u ?? b.w ?? 0) - (a.u ?? a.w ?? 0)).slice(0, 4).map((p) => p.id);
  const concepto = Object.values(categoriaConcepto).find((x) => x.producto?.registro_base === f.id);
  return {
    id: f.id, n: f.nombre, cat: f.categoria, pres: PRES[f.presentacion] || f.presentacion,
    ben: f.beneficio || '', desc: f.descripcion || '', ing: ingredientes(f.formula), formula: f.formula,
    us, mx, crec: crec == null ? null : Math.round(crec), t: crec == null ? 'sindato' : crec >= 10 ? 'sube' : crec <= -15 ? 'baja' : 'estable',
    refs, nprod: m.length, marcas: marcasPorRegistro[f.id] || [],
    extra: concepto ? { angulo: concepto.angulo_venta, ganchos: concepto.ganchos_tiktok, precio: concepto.precio_cop } : null,
  };
});

// ---------- Registros nuevos de la línea propia (N1, N2…) ----------
const formulas = existe('datos/formulas_mandar_a_hacer.json') ? leer('datos/formulas_mandar_a_hacer.json') : [];
const formulaDe = (clave) => formulas.find((x) => x.clave === clave);
const ingDe = (fx) => fx.ingredientes.map((i) => `${i.nombre}: ${i.dosis}`);
const ventasRefs = (ids, region) => ids.map((id) => productos.find((p) => p.id === id)).filter((p) => p && p.paises.includes(region)).reduce((s, p) => s + (p.u || 0), 0);
for (const n of regNuevos) {
  const fx = n.clave ? formulaDe(n.clave) : null;
  const refs = n.refs.filter((id) => productos.some((p) => p.id === id));
  registros.push({
    id: n.id, n: n.nombre, cat: n.categoria, pres: n.presentacion, ben: n.beneficio, desc: n.descripcion,
    ing: fx ? ingDe(fx) : ingredientes(n.formula), formula: fx ? ingDe(fx).join(' + ') : n.formula,
    us: ventasRefs(refs, 'US'), mx: ventasRefs(refs, 'MX'), crec: null, t: 'sindato', periodo: '28 días',
    refs: refs.slice(0, 4), nprod: productos.filter((p) => p.f === n.id).length, marcas: n.marcas, extra: null, nuevo: true,
  });
  if (n.maneja) yaManejaExtra[n.id] = n.maneja;
}

const categorias = Object.keys(CATEGORIAS).map((cod) => {
  const ps = productos.filter((p) => p.cat === cod);
  const rs = registros.filter((r) => r.cat === cod);
  return { cod, n: CATEGORIAS[cod], total: ps.reduce((s, p) => s + (p.u || 0), 0), np: ps.length, nr: rs.length, problema: categoriaConcepto[cod]?.problema || '' };
}).filter((c) => c.np > 0 || c.nr > 0).sort((a, b) => b.total - a.total);
const orden = categorias.map((c) => c.cod);
// ---------- Prioridad: primero lo que más podría venderse, al final quemados y lo que ya manejan ----------
const yaLoManejan = { ...(existe('datos/ya_lo_manejan.json') ? leer('datos/ya_lo_manejan.json').registros : {}), ...yaManejaExtra };
const FACTOR = { sube: 1.35, nuevo: 1.3, estable: 1, sindato: 0.9, baja: 0.75, quemado: 0.4 };
for (const p of productos) {
  const ventas = p.u ?? (p.w != null ? p.w * 4 : 0);
  p.score = Math.round(ventas * (FACTOR[p.t] ?? 1));
  p.nivel = p.t === 'quemado' ? 2 : 0; // los quemados van al final
}
for (const r of registros) {
  const m = productos.filter((p) => p.f === r.id);
  const total = m.reduce((s, p) => s + (p.u || 0), 0);
  const quemado = m.filter((p) => p.t === 'quemado').reduce((s, p) => s + (p.u || 0), 0);
  r.quem = total > 0 && quemado / total >= 0.5; // más de la mitad de sus ventas vienen de productos quemados
  r.maneja = yaLoManejan[r.id] || '';
  r.score = Math.round((r.us + r.mx) * (FACTOR[r.t] ?? 1));
  r.nivel = r.maneja ? 3 : r.quem ? 2 : 0;
}
const porPrioridad = (a, b) => a.nivel - b.nivel || b.score - a.score;
registros.sort((a, b) => orden.indexOf(a.cat) - orden.indexOf(b.cat) || porPrioridad(a, b));

// ---------- Pestaña "Para mandar a hacer" ----------
// Línea propia: los productos que el cliente ya conoce (fórmulas investigadas) + lo que ya manejan.
const LINEA = [['N1', 'melatonina_gomita'], ['N2', 'melatonina_gotas'], ['N3', 'te_laxante'], ['F06', 'colageno'], ['N4', 'biotina_cabello'], ['N5', 'magnesio_ninos_gotas'], ['N6', null], ['F01', null]];
const regMap = Object.fromEntries(registros.map((r) => [r.id, r]));
const itemMandar = (id, clave) => {
  const r = regMap[id]; if (!r) return null;
  const fx = clave ? formulaDe(clave) : null;
  return {
    reg: id, estado: r.maneja ? 'Ya lo manejan' : clave ? 'Línea propia' : 'Del ranking',
    ing: fx ? fx.ingredientes.map((i) => ({ n: i.nombre, d: i.dosis })) : r.ing.map((x) => ({ n: x, d: '' })),
    porcion: fx?.porcion || '', envase: fx?.envase || '', como: fx?.como_se_toma || '',
  };
};
const mandar = {
  linea: LINEA.map(([id, clave]) => itemMandar(id, clave)).filter(Boolean)
    .sort((a, b) => (regMap[a.reg].maneja ? 1 : 0) - (regMap[b.reg].maneja ? 1 : 0) || regMap[b.reg].score - regMap[a.reg].score),
  top: registros.filter((r) => r.nivel === 0 && !LINEA.some(([id]) => id === r.id)).sort((a, b) => b.score - a.score).slice(0, 15).map((r) => itemMandar(r.id, null)),
};

// ---------- Imágenes (data URI) ----------
// Fotos medianas en la página; las grandes van en archivos aparte (grandes_*.json) que se cargan al ampliar.
// Empaques: imagen generada con las 3 marcas de cada registro (salida/empaques/<registro>.jpg).
const DIR_EMP = path.join(RAIZ, 'salida', 'empaques');
const imgs = {}, imgsG = {}, emp = {}, empG = {};
const dataUri = (ruta) => 'data:image/jpeg;base64,' + fs.readFileSync(ruta).toString('base64');
for (const p of productos) {
  const g = path.join(DIR_IMG, `${p.id}.jpg`), m = path.join(DIR_IMG, `m_${p.id}.jpg`);
  if (fs.existsSync(m)) imgs[p.id] = dataUri(m);
  if (fs.existsSync(g)) imgsG[p.id] = dataUri(g);
}
for (const r of registros) {
  const g = path.join(DIR_EMP, `${r.id}.jpg`), m = path.join(DIR_EMP, `m_${r.id}.jpg`);
  if (fs.existsSync(m)) emp[r.id] = dataUri(m);
  if (fs.existsSync(g)) empG[r.id] = dataUri(g);
}
const DIR_WEB = path.dirname(SALIDA);
fs.mkdirSync(DIR_WEB, { recursive: true });
fs.writeFileSync(path.join(DIR_WEB, 'grandes_productos.json'), JSON.stringify(imgsG));
fs.writeFileSync(path.join(DIR_WEB, 'grandes_empaques.json'), JSON.stringify(empG));
const sinEmpaque = registros.filter((r) => !emp[r.id]).map((r) => r.id);
if (sinEmpaque.length) console.warn(`Registros sin foto de empaque (${sinEmpaque.length}):`, sinEmpaque.join(', '));

// ---------- Control de calidad ----------
const sinMarcas = registros.filter((r) => r.marcas.length !== 3).map((r) => r.id);
const todas = registros.flatMap((r) => r.marcas.map((b) => b.nombre.toLowerCase()));
const repetidas = [...new Set(todas.filter((n, i) => todas.indexOf(n) !== i))];
const magnifica = JSON.stringify({ registros, categorias }).match(/magn[ií]fic/gi);
if (sinMarcas.length) console.warn('Registros sin 3 marcas:', sinMarcas.join(', '));
if (repetidas.length) console.warn('Marcas repetidas:', repetidas.join(', '));
if (magnifica) console.warn('ATENCIÓN: quedan menciones a MAGNIFICA:', magnifica.length);

const DATA = {
  corte: '2 de octubre de 2026',
  kpi: {
    registros: registros.length, productos: productos.length, publicaciones: pub.size,
    marcas: registros.reduce((s, r) => s + r.marcas.length, 0),
    unidades: usMes.reduce((s, p) => s + p.unidades_periodo, 0) + mxMes.reduce((s, p) => s + p.unidades_periodo, 0),
  },
  categorias, registros, productos, imgs, emp, mandar,
};
// Datos sin imágenes para el Excel (mismo orden y prioridad que la web)
fs.writeFileSync(path.join(RAIZ, 'datos', 'web_datos.json'), JSON.stringify({ ...DATA, imgs: undefined, emp: undefined }, null, 1), 'utf8');
let html = fs.readFileSync(PLANTILLA, 'utf8').replace('/*__DATA__*/null', JSON.stringify(DATA).replace(/</g, '\\u003c'));
fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, html, 'utf8');
const mb = (f) => (fs.statSync(path.join(DIR_WEB, f)).size / 1048576).toFixed(1);
console.log(`Archivos aparte: grandes_productos.json ${mb('grandes_productos.json')} MB · grandes_empaques.json ${mb('grandes_empaques.json')} MB`);
console.log(`Web: ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB · ${registros.length} registros · ${productos.length} productos únicos (${pub.size} publicaciones) · ${DATA.kpi.marcas} marcas · ${Object.keys(emp).length} fotos de empaque`);
