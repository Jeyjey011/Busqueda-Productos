// Genera la web interactiva para Guillermo: salida/web/index.html (una sola página con datos e imágenes embebidos).
// Requiere: construir_excel.js corrido antes (imágenes en caché) y datos/marcas_propuestas.json.
// Uso: node scripts/construir_web.js
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIR_FM = path.join(RAIZ, 'datos', 'fastmoss');
const DIR_CACHE = path.join(RAIZ, 'salida', 'cache_imagenes');
const PLANTILLA = path.join(__dirname, 'web_plantilla.html');
const SALIDA = path.join(RAIZ, 'salida', 'web', 'index.html');
const FIN_PERIODO = new Date('2026-09-30');

const leer = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const usMes = leer('datos/fastmoss/us_mensual_2026-09.json');
const mxMes = leer('datos/fastmoss/mx_mensual_2026-09.json');
const semanal = leer('datos/fastmoss/semanal_2026-W39.json');
const nuevos = leer('datos/fastmoss/nuevos_us_2026-09.json');
const plan = leer('datos/plan_registros.json');
// Marcas: un archivo por categoría en datos/marcas/<COD>.json (lo escriben los agentes en paralelo)
const DIR_MARCAS = path.join(RAIZ, 'datos', 'marcas');
const marcas = fs.existsSync(DIR_MARCAS)
  ? fs.readdirSync(DIR_MARCAS).filter((f) => /^[A-Z]{3}\.json$/.test(f)).map((f) => {
    try { return JSON.parse(fs.readFileSync(path.join(DIR_MARCAS, f), 'utf8')); } catch (e) { console.warn('Marca inválida', f, e.message); return null; }
  }).filter((m) => m && Array.isArray(m.marcas) && m.marcas.length && m.producto)
  : [];
const clasif = new Map();
for (const f of fs.readdirSync(DIR_FM).filter((f) => /^clasificado_lote_\d+\.json$/.test(f))) {
  for (const c of JSON.parse(fs.readFileSync(path.join(DIR_FM, f), 'utf8'))) clasif.set(String(c.product_id), c);
}

const CATEGORIAS = {
  DIG: 'Digestión', SUE: 'Sueño y estrés', ENE: 'Energía y gym', COL: 'Colágeno y antiedad', SXF: 'Salud femenina',
  PES: 'Peso y metabolismo', CAB: 'Cabello, piel y uñas', INM: 'Inmunidad y vitaminas', COR: 'Corazón y circulación',
  SXM: 'Masculino', PRO: 'Próstata', CER: 'Cerebro y concentración', ART: 'Articulaciones', BBL: 'Curvas', NIN: 'Niños',
};
const PRES = { Softgel: 'Cápsula blanda', 'Líquido/Shot': 'Líquido', 'Sachet/Stick': 'Sobre / stick', 'Té/Infusión': 'Té' };

// Productos
const prod = new Map();
const agregar = (p, region, extra) => {
  const id = String(p.product_id);
  if (!prod.has(id)) prod.set(id, { id, region, titulo: p.titulo, tienda: p.tienda, lanz: p.fecha_lanzamiento, url: p.url_fastmoss });
  Object.assign(prod.get(id), extra);
};
usMes.forEach((p) => agregar(p, 'US', { unid: p.unidades_periodo, crec: p.crecimiento_pct }));
mxMes.forEach((p) => agregar(p, 'MX', { unid: p.unidades_periodo, crec: p.crecimiento_pct }));
semanal.forEach((p) => agregar(p, p.ranking.split(' ')[0], { sem: p.unidades_periodo }));
nuevos.forEach((p) => agregar(p, 'US', {}));
function tendencia(p) {
  const d = p.lanz ? (FIN_PERIODO - new Date(p.lanz)) / 864e5 : null;
  if (d != null && d <= 90) return 'nuevo';
  if (p.crec == null) return 'sindato';
  if (p.crec >= 10) return 'sube';
  if (p.crec <= -20 && d > 365) return 'quemado';
  if (p.crec <= -15) return 'baja';
  return 'estable';
}

// Registros: datos/plan_web.json (todos los productos clasificados, fórmula viral completa); si no existe, el plan original
const planWeb = fs.existsSync(path.join(RAIZ, 'datos', 'plan_web.json')) ? leer('datos/plan_web.json') : null;
const familias = planWeb ? planWeb.registros : plan.familias.map((f) => ({ id: f.familia_id, nombre: f.nombre, categoria: f.categoria, presentacion: PRES[f.vehiculo] || f.vehiculo, formula: f.formula_base, descripcion: '' }));
const asignacion = planWeb ? planWeb.asignacion : plan.asignacion;
const famIds = new Set(familias.map((f) => f.id));
const productos = [];
for (const p of prod.values()) {
  const c = clasif.get(p.id) || {};
  if (!c.categoria || c.categoria === 'EXC' || c.es_ingerible === false) continue;
  const fam = asignacion[p.id];
  productos.push({
    id: p.id, n: c.nombre_corto || p.titulo, m: c.marca || p.tienda, r: p.region, cat: c.categoria,
    v: PRES[c.vehiculo] || c.vehiculo || 'Otro', s: c.para_que_sirve || '', u: p.unid ?? null, w: p.sem ?? null,
    c: p.crec ?? null, t: tendencia(p), f: famIds.has(fam) ? fam : null, url: p.url,
  });
}

const registros = familias.map((f) => {
  const m = productos.filter((p) => p.f === f.id);
  const conMes = m.filter((p) => p.u != null);
  const us = conMes.filter((p) => p.r === 'US').reduce((s, p) => s + p.u, 0);
  const mx = conMes.filter((p) => p.r === 'MX').reduce((s, p) => s + p.u, 0);
  const antes = conMes.reduce((s, p) => s + p.u / (1 + (p.c || 0) / 100), 0);
  const crec = antes ? ((us + mx) / antes - 1) * 100 : null;
  const vistos = new Set();
  const vivos = conMes.filter((p) => p.t !== 'quemado');
  const base = vivos.length ? vivos : conMes.length ? conMes : m;
  const refs = [...base].sort((a, b) => (b.u ?? b.w ?? 0) - (a.u ?? a.w ?? 0))
    .filter((p) => { const k = p.n.toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 4).map((p) => p.id);
  return {
    id: f.id, n: f.nombre, cat: f.categoria, pres: PRES[f.presentacion] || f.presentacion, formula: f.formula, desc: f.descripcion || '',
    us, mx, crec: crec == null ? null : Math.round(crec),
    t: crec == null ? 'sindato' : crec >= 10 ? 'sube' : crec <= -15 ? 'baja' : 'estable', refs, nprod: m.length,
  };
});

// Categorías con al menos un producto
const categorias = Object.keys(CATEGORIAS).map((cod) => {
  const ps = productos.filter((p) => p.cat === cod);
  return { cod, n: CATEGORIAS[cod], total: ps.reduce((s, p) => s + (p.u || 0), 0), np: ps.length };
}).filter((c) => c.np > 0).sort((a, b) => b.total - a.total);

// Imágenes embebidas (data URI)
const imgs = {};
for (const p of productos) {
  const ruta = path.join(DIR_CACHE, `${p.id}.jpg`);
  if (fs.existsSync(ruta)) imgs[p.id] = 'data:image/jpeg;base64,' + fs.readFileSync(ruta).toString('base64');
}

const ordenCat = categorias.map((c) => c.cod);
registros.sort((a, b) => ordenCat.indexOf(a.cat) - ordenCat.indexOf(b.cat) || (b.us + b.mx) - (a.us + a.mx));
marcas.sort((a, b) => (ordenCat.indexOf(a.categoria) + 99) % 99 - (ordenCat.indexOf(b.categoria) + 99) % 99);

const DATA = {
  corte: '2 de octubre de 2026',
  kpi: {
    publicaciones: prod.size, unidades: usMes.reduce((s, p) => s + p.unidades_periodo, 0) + mxMes.reduce((s, p) => s + p.unidades_periodo, 0),
    registros: registros.length, marcas: marcas.reduce((s, m) => s + m.marcas.length, 0),
    quemados: productos.filter((p) => p.t === 'quemado').length, categorias: categorias.length,
  },
  categorias, registros, productos, marcas, imgs,
};

let html = fs.readFileSync(PLANTILLA, 'utf8');
const json = JSON.stringify(DATA).replace(/</g, '\\u003c');
html = html.replace('/*__DATA__*/null', json);
fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, html, 'utf8');
console.log(`Web escrita en ${SALIDA} · ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB · ${productos.length} productos · ${registros.length} registros · ${marcas.length} categorías con marca`);
