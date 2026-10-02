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

const categorias = Object.keys(CATEGORIAS).map((cod) => {
  const ps = productos.filter((p) => p.cat === cod);
  const rs = registros.filter((r) => r.cat === cod);
  return { cod, n: CATEGORIAS[cod], total: ps.reduce((s, p) => s + (p.u || 0), 0), np: ps.length, nr: rs.length, problema: categoriaConcepto[cod]?.problema || '' };
}).filter((c) => c.np > 0 || c.nr > 0).sort((a, b) => b.total - a.total);
const orden = categorias.map((c) => c.cod);
registros.sort((a, b) => orden.indexOf(a.cat) - orden.indexOf(b.cat) || (b.us + b.mx) - (a.us + a.mx));

// ---------- Imágenes (data URI) ----------
// Fotos medianas (240 px) para la página y grandes (520 px) solo para ampliar
const imgs = {}, imgsG = {};
const dataUri = (ruta) => 'data:image/jpeg;base64,' + fs.readFileSync(ruta).toString('base64');
for (const p of productos) {
  const g = path.join(DIR_IMG, `${p.id}.jpg`), m = path.join(DIR_IMG, `m_${p.id}.jpg`);
  if (fs.existsSync(m)) imgs[p.id] = dataUri(m);
  if (fs.existsSync(g)) imgsG[p.id] = dataUri(g);
}

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
  categorias, registros, productos, imgs, imgsG,
};
let html = fs.readFileSync(PLANTILLA, 'utf8').replace('/*__DATA__*/null', JSON.stringify(DATA).replace(/</g, '\\u003c'));
fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, html, 'utf8');
console.log(`Web: ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB · ${registros.length} registros · ${productos.length} productos únicos (${pub.size} publicaciones) · ${DATA.kpi.marcas} marcas`);
