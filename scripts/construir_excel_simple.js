// Excel corto para Guillermo: qué registros sacar y los productos por categoría y presentación.
// Usa los mismos datos que construir_excel.js (correr ese primero para tener las imágenes en caché).
// Uso: node scripts/construir_excel_simple.js
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const RAIZ = path.join(__dirname, '..');
const DIR_FM = path.join(RAIZ, 'datos', 'fastmoss');
const DIR_CACHE = path.join(RAIZ, 'salida', 'cache_imagenes');
const SALIDA = path.join(RAIZ, 'salida', 'Productos_a_registrar_Guillermo.xlsx');
const FIN_PERIODO = new Date('2026-09-30');

const leer = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const usMes = leer('datos/fastmoss/us_mensual_2026-09.json');
const mxMes = leer('datos/fastmoss/mx_mensual_2026-09.json');
const semanal = leer('datos/fastmoss/semanal_2026-W39.json');
const nuevos = leer('datos/fastmoss/nuevos_us_2026-09.json');
const plan = leer('datos/plan_registros.json');
const clasif = new Map();
for (const f of fs.readdirSync(DIR_FM).filter((f) => /^clasificado_lote_\d+\.json$/.test(f))) {
  for (const c of JSON.parse(fs.readFileSync(path.join(DIR_FM, f), 'utf8'))) clasif.set(String(c.product_id), c);
}

// Nombres cortos de categoría (también nombres de pestaña, máx. 31 caracteres)
const CATEGORIAS = {
  DIG: 'Digestión, hinchazón y colon', SUE: 'Sueño, estrés y cortisol', ENE: 'Energía, músculo y gym', COL: 'Colágeno y antiedad', SXF: 'Salud íntima y libido femenina',
  PES: 'Quemar grasa y bajar de peso', CAB: 'Cabello, piel y uñas', INM: 'Defensas y vitaminas', COR: 'Circulación y corazón',
  SXM: 'Potencia sexual masculina', PRO: 'Próstata', CER: 'Cerebro y concentración', ART: 'Articulaciones y huesos', BBL: 'Aumentar glúteos y curvas', NIN: 'Niños',
};
const PRESENTACION_PLURAL = {
  Cápsula: 'Cápsulas', Softgel: 'Cápsulas blandas (softgel)', Tableta: 'Tabletas', Gomita: 'Gomitas', Polvo: 'Polvos',
  'Líquido/Shot': 'Líquidos y shots', Gotas: 'Gotas', 'Té/Infusión': 'Tés', 'Sachet/Stick': 'Sobres y sticks', Efervescente: 'Efervescentes', Otro: 'Otros',
};
const PRESENTACION = { Softgel: 'Cápsula blanda', 'Líquido/Shot': 'Líquido', 'Sachet/Stick': 'Sobre / stick' };
const TENDENCIA = {
  Nuevo: { fill: 'FFD9EAD3', font: 'FF274E13', txt: 'Nuevo' },
  Subiendo: { fill: 'FFC6EFCE', font: 'FF006100', txt: '▲ Subiendo' },
  Estable: { fill: 'FFDDEBF7', font: 'FF1F3A5F', txt: '● Estable' },
  Bajando: { fill: 'FFFFEB9C', font: 'FF7F4F00', txt: '▼ Bajando' },
  Quemado: { fill: 'FFFFC7CE', font: 'FF9C0006', txt: '✖ Quemado' },
  'Sin dato': { fill: 'FFF2F2F2', font: 'FF57606A', txt: 'Sin dato' },
};
const C = { azul: 'FF1F3A5F', verde: 'FF2E7D6B', grisClaro: 'FFF2F2F2', borde: 'FFD0D7DE', blanco: 'FFFFFFFF' };
const B = { style: 'thin', color: { argb: C.borde } };
const BORDES = { top: B, left: B, bottom: B, right: B };
const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

// ---------- Productos con ventas y tendencia ----------
const prod = new Map();
const agregar = (p, region, extra) => {
  const id = String(p.product_id);
  if (!prod.has(id)) prod.set(id, { id, region, titulo: p.titulo, tienda: p.tienda, moneda: p.moneda, lanzamiento: p.fecha_lanzamiento, url: p.url_fastmoss, precio: p.precio_min ?? p.precio_actual ?? null });
  Object.assign(prod.get(id), extra);
};
usMes.forEach((p) => agregar(p, 'US', { unid: p.unidades_periodo, crec: p.crecimiento_pct }));
mxMes.forEach((p) => agregar(p, 'MX', { unid: p.unidades_periodo, crec: p.crecimiento_pct }));
semanal.forEach((p) => agregar(p, p.ranking.split(' ')[0], { sem: p.unidades_periodo }));
nuevos.forEach((p) => agregar(p, 'US', {}));

const diasEnMercado = (p) => (p.lanzamiento ? (FIN_PERIODO - new Date(p.lanzamiento)) / 864e5 : null);
function tendencia(p) {
  const d = diasEnMercado(p);
  if (d != null && d <= 90) return 'Nuevo';
  if (p.crec == null) return 'Sin dato';
  if (p.crec >= 10) return 'Subiendo';
  if (p.crec <= -20 && d > 365) return 'Quemado';
  if (p.crec <= -15) return 'Bajando';
  return 'Estable';
}
// Registros: datos/plan_web.json (todos los productos clasificados, fórmula viral completa)
const planWeb = fs.existsSync(path.join(RAIZ, 'datos', 'plan_web.json')) ? leer('datos/plan_web.json') : null;
const asignacion = planWeb ? planWeb.asignacion : plan.asignacion;
for (const p of prod.values()) { p.c = clasif.get(p.id) || {}; p.tend = tendencia(p); p.fam = asignacion[p.id]; }

const familias = planWeb ? planWeb.registros : plan.familias.map((f) => ({ id: f.familia_id, nombre: f.nombre, categoria: f.categoria, presentacion: PRESENTACION[f.vehiculo] || f.vehiculo, formula: f.formula_base }));
const famPorId = new Map(familias.map((f) => [f.id, f]));
for (const f of familias) {
  const m = [...prod.values()].filter((p) => p.fam === f.id);
  const conMes = m.filter((p) => p.unid != null);
  f._us = conMes.filter((p) => p.region === 'US').reduce((s, p) => s + p.unid, 0);
  f._mx = conMes.filter((p) => p.region === 'MX').reduce((s, p) => s + p.unid, 0);
  const antes = conMes.reduce((s, p) => s + p.unid / (1 + (p.crec || 0) / 100), 0);
  f._crec = antes ? ((f._us + f._mx) / antes - 1) * 100 : null;
  f._tend = f._crec == null ? 'Sin dato' : f._crec >= 10 ? 'Subiendo' : f._crec <= -15 ? 'Bajando' : 'Estable';
  // productos de referencia: los que más venden, sin quemados y sin repetir nombre
  const vistos = new Set();
  const base = conMes.filter((p) => p.tend !== 'Quemado').length ? conMes.filter((p) => p.tend !== 'Quemado') : (conMes.length ? conMes : m);
  f._refs = [...base].sort((a, b) => (b.unid ?? b.sem ?? 0) - (a.unid ?? a.sem ?? 0))
    .filter((p) => { const k = (p.c.nombre_corto || p.titulo).toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; });
  f._img = f._refs[0] || m[0];
}

// ---------- Ayudantes ----------
const imagenes = new Map();
function imagen(wb, id) {
  if (imagenes.has(id)) return imagenes.get(id);
  const ruta = path.join(DIR_CACHE, `${id}.jpg`);
  const img = fs.existsSync(ruta) ? wb.addImage({ buffer: fs.readFileSync(ruta), extension: 'jpeg' }) : undefined;
  imagenes.set(id, img);
  return img;
}
function encabezado(ws, titulo, subtitulo, ncols) {
  ws.mergeCells(1, 1, 1, ncols);
  Object.assign(ws.getCell(1, 1), { value: titulo });
  ws.getCell(1, 1).font = { size: 16, bold: true, color: { argb: C.blanco } };
  ws.getCell(1, 1).fill = relleno(C.azul);
  ws.getCell(1, 1).alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 32;
  ws.mergeCells(2, 1, 2, ncols);
  ws.getCell(2, 1).value = subtitulo;
  ws.getCell(2, 1).font = { size: 10, italic: true, color: { argb: 'FF57606A' } };
  ws.getCell(2, 1).alignment = { vertical: 'middle', wrapText: true, indent: 1 };
  ws.getRow(2).height = 30;
}
function cabeceras(ws, fila, cols) {
  cols.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.w;
    const cell = ws.getCell(fila, i + 1);
    cell.value = c.h; cell.font = { bold: true, size: 10, color: { argb: C.blanco } }; cell.fill = relleno(C.verde);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.border = BORDES;
  });
  ws.getRow(fila).height = 44;
}
function seccion(ws, fila, texto, ncols, color = C.azul) {
  ws.mergeCells(fila, 1, fila, ncols);
  const c = ws.getCell(fila, 1);
  c.value = texto; c.font = { bold: true, size: 12, color: { argb: C.blanco } }; c.fill = relleno(color);
  c.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(fila).height = 24;
}
function fila(ws, r, cols, dato, n, wb, idImagen) {
  let lineas = 1;
  cols.forEach((col, i) => {
    const c = ws.getCell(r, i + 1);
    const v = col.k(dato);
    c.value = v ?? null; c.border = BORDES; c.font = { size: 10 };
    c.alignment = { vertical: 'middle', wrapText: !!col.wrap, horizontal: col.centro ? 'center' : undefined };
    if (col.fmt) c.numFmt = col.fmt;
    if (n % 2) c.fill = relleno(C.grisClaro);
    if (col.tend && TENDENCIA[v]) {
      c.value = TENDENCIA[v].txt; c.fill = relleno(TENDENCIA[v].fill);
      c.font = { size: 10, bold: true, color: { argb: TENDENCIA[v].font } }; c.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    if (v && typeof v === 'object' && v.hyperlink) c.font = { size: 10, color: { argb: 'FF0563C1' }, underline: true };
    if (col.negrita) c.font = { ...c.font, bold: true, size: 11 };
    if (col.wrap && typeof v === 'string') lineas = Math.max(lineas, v.split('\n').reduce((s, t) => s + Math.max(1, Math.ceil(t.length / (col.w * 1.05))), 0));
  });
  ws.getRow(r).height = Math.max(64, lineas * 13.5 + 6);
  const img = idImagen && imagen(wb, idImagen);
  if (img !== undefined) ws.addImage(img, { tl: { col: 0.08, row: r - 1 + 0.05 }, ext: { width: 80, height: 80 }, editAs: 'oneCell' });
}
const pres = (v) => PRESENTACION[v] || v || '';
const nombre = (p) => p.c.nombre_corto || p.titulo;
const pais = (r) => (r === 'US' ? 'EE. UU.' : 'México');

// ---------- Libro ----------
const wb = new ExcelJS.Workbook();
wb.creator = 'Claude (proyecto INVIMA)';

// Hoja 1: registros a sacar, agrupados por categoría
{
  const ws = wb.addWorksheet('Registros a sacar', { properties: { tabColor: { argb: C.verde } }, views: [{ state: 'frozen', ySplit: 5, showGridLines: false }] });
  const cols = [
    { h: 'Imagen', w: 13, k: () => null },
    { h: 'Registro', w: 9, k: (f) => f.id, centro: true, negrita: true },
    { h: 'Qué registrar', w: 30, k: (f) => f.nombre, wrap: true, negrita: true },
    { h: 'Para qué es', w: 24, k: (f) => f.beneficio || f.descripcion || '', wrap: true, negrita: true },
    { h: 'Presentación', w: 14, k: (f) => pres(f.presentacion), centro: true },
    { h: 'Fórmula (lo que lleva)', w: 48, k: (f) => f.formula, wrap: true },
    { h: 'Se parece a estos productos virales', w: 40, k: (f) => f._refs.slice(0, 3).map((p) => `• ${nombre(p)} (${pais(p.region)})`).join('\n'), wrap: true },
    { h: 'Ventas sep EE. UU. (unidades)', w: 13, k: (f) => f._us, fmt: '#,##0' },
    { h: 'Ventas sep México (unidades)', w: 13, k: (f) => f._mx, fmt: '#,##0' },
    { h: 'Tendencia vs. agosto', w: 13, k: (f) => f._tend, tend: true },
    { h: 'Marcas en el registro', w: 18, k: () => 'MAGNIFICA + 2 marcas', wrap: true, centro: true },
  ];
  encabezado(ws, 'Registros INVIMA a sacar', 'Cada fila es UN registro sanitario (una fórmula en una presentación) y sirve para hasta 3 marcas: MAGNIFICA + 2. Todos se sacan de una vez. Ventas de septiembre de 2026 en TikTok Shop según FastMoss.', cols.length);
  ws.mergeCells(3, 1, 3, cols.length);
  ws.getCell(3, 1).value = `Total: ${familias.length} registros. Tendencia: ▲ subiendo (+10 % o más) · ● estable · ▼ bajando (−15 % o menos), comparando septiembre con agosto.`;
  ws.getCell(3, 1).font = { size: 10, bold: true, color: { argb: C.azul } };
  ws.getCell(3, 1).alignment = { indent: 1, vertical: 'middle', wrapText: true };
  ws.getRow(3).height = 22;
  cabeceras(ws, 5, cols);
  const porCat = {};
  for (const f of familias) (porCat[f.categoria] ||= []).push(f);
  const catsOrden = Object.keys(porCat).sort((a, b) =>
    porCat[b].reduce((s, f) => s + f._us + f._mx, 0) - porCat[a].reduce((s, f) => s + f._us + f._mx, 0));
  let r = 6;
  for (const cat of catsOrden) {
    const lista = porCat[cat].sort((a, b) => (b._us + b._mx) - (a._us + a._mx));
    seccion(ws, r++, `${CATEGORIAS[cat] || cat}  ·  ${lista.length} ${lista.length === 1 ? 'registro' : 'registros'}`, cols.length);
    lista.forEach((f, n) => fila(ws, r++, cols, f, n, wb, f._img?.id));
  }
  ws.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '5:5' };
}

// Hojas por categoría: productos agrupados por presentación
const ingeribles = [...prod.values()].filter((p) => p.c.categoria && p.c.categoria !== 'EXC' && p.c.es_ingerible !== false);
const totalCat = (cat) => ingeribles.filter((p) => p.c.categoria === cat).reduce((s, p) => s + (p.unid || 0), 0);
const cats = Object.keys(CATEGORIAS).filter((c) => ingeribles.some((p) => p.c.categoria === c)).sort((a, b) => totalCat(b) - totalCat(a));
for (const cat of cats) {
  const ws = wb.addWorksheet(CATEGORIAS[cat], { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  const cols = [
    { h: 'Imagen', w: 13, k: () => null },
    { h: 'Producto', w: 40, k: (p) => nombre(p), wrap: true, negrita: true },
    { h: 'Marca', w: 18, k: (p) => p.c.marca || p.tienda, wrap: true },
    { h: 'País', w: 9, k: (p) => pais(p.region), centro: true },
    { h: 'Para qué sirve', w: 34, k: (p) => p.c.beneficio || p.c.para_que_sirve || '', wrap: true },
    { h: 'Ventas sep (unidades)', w: 12, k: (p) => p.unid ?? null, fmt: '#,##0' },
    { h: 'Ventas semana 21-27 sep', w: 12, k: (p) => p.sem ?? null, fmt: '#,##0' },
    { h: 'Tendencia', w: 13, k: (p) => p.tend, tend: true },
    { h: 'Registro', w: 28, k: (p) => { const f = famPorId.get(p.fam); return f ? `${f.id} · ${f.nombre}` : ''; }, wrap: true },
    { h: 'Ver', w: 10, k: (p) => (p.url ? { text: 'FastMoss', hyperlink: p.url } : null), centro: true },
  ];
  const lista = ingeribles.filter((p) => p.c.categoria === cat);
  encabezado(ws, `${CATEGORIAS[cat]} · ${lista.length} productos virales`, 'Productos más vendidos de TikTok Shop EE. UU. y México (FastMoss), agrupados por presentación y ordenados por ventas de septiembre de 2026. "¿Lo sacamos?" dice en qué registro entra cada producto.', cols.length);
  cabeceras(ws, 4, cols);
  let r = 5;
  const porPres = {};
  for (const p of lista) (porPres[p.c.vehiculo || 'Otro'] ||= []).push(p);
  const ventas = (arr) => arr.reduce((s, p) => s + (p.unid || 0), 0);
  for (const v of Object.keys(porPres).sort((a, b) => ventas(porPres[b]) - ventas(porPres[a]))) {
    const g = porPres[v].sort((a, b) => (b.unid ?? -1) - (a.unid ?? -1) || (b.sem ?? -1) - (a.sem ?? -1));
    seccion(ws, r++, `${(PRESENTACION_PLURAL[v] || v).toUpperCase()}  ·  ${g.length}`, cols.length, C.verde);
    g.forEach((p, n) => fila(ws, r++, cols, p, n, wb, p.id));
  }
  ws.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '4:4' };
}

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
wb.xlsx.writeFile(SALIDA).then(() => console.log('Excel escrito en', SALIDA, '·', cats.length, 'categorías'));
