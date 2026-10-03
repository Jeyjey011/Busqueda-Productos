// Excel corto para Guillermo, con los mismos datos y el mismo orden de prioridad que la web.
// Requiere: node scripts/construir_web.js (escribe datos/web_datos.json) e imágenes en salida/cache_imagenes_web y salida/empaques.
// Uso: node scripts/construir_excel_simple.js
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const RAIZ = path.join(__dirname, '..');
const SALIDA = path.join(RAIZ, 'salida', 'Productos_a_registrar_Guillermo.xlsx');
const D = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'web_datos.json'), 'utf8'));
const regPorId = Object.fromEntries(D.registros.map((r) => [r.id, r]));
const prodPorId = Object.fromEntries(D.productos.map((p) => [p.id, p]));
const catNombre = (cod) => D.categorias.find((c) => c.cod === cod)?.n || cod;
const PAIS = { US: 'EE. UU.', MX: 'México' };
const paises = (arr) => (arr || []).map((r) => PAIS[r] || r).join(' y ');
const PLURAL = { 'Cápsula': 'Cápsulas', 'Cápsula blanda': 'Cápsulas blandas', 'Tableta': 'Tabletas', 'Gomita': 'Gomitas', 'Polvo': 'Polvos', 'Líquido': 'Líquidos', 'Gotas': 'Gotas', 'Sobre / stick': 'Sobres y sticks', 'Té': 'Tés', 'Otro': 'Otros' };
const TEND = {
  sube: { fill: 'FFC6EFCE', font: 'FF006100', txt: '▲ Subiendo' }, estable: { fill: 'FFDDEBF7', font: 'FF1F3A5F', txt: '● Estable' },
  baja: { fill: 'FFFFEB9C', font: 'FF7F4F00', txt: '▼ Bajando' }, quemado: { fill: 'FFFFC7CE', font: 'FF9C0006', txt: '✖ Quemado' },
  nuevo: { fill: 'FFE8DEF8', font: 'FF4B2C8F', txt: '✦ Nuevo' }, sindato: { fill: 'FFF2F2F2', font: 'FF57606A', txt: 'Sin dato' },
};
const C = { azul: 'FF1F3A5F', verde: 'FF2E7D6B', grisClaro: 'FFF2F2F2', borde: 'FFD0D7DE', blanco: 'FFFFFFFF', lima: 'FFE3F26B', negro: 'FF10201A' };
const B = { style: 'thin', color: { argb: C.borde } };
const BORDES = { top: B, left: B, bottom: B, right: B };
const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const fmt = (n) => (n == null ? '' : Number(n).toLocaleString('es-CO'));
const estadoDe = (r) => (r.maneja ? 'Ya lo manejan' : r.quem ? 'Quemado' : '');

// ---------- imágenes ----------
const cache = new Map();
function imagen(wb, clave) {
  if (cache.has(clave)) return cache.get(clave);
  const ruta = clave.startsWith('E:') ? path.join(RAIZ, 'salida', 'empaques', `m_${clave.slice(2)}.jpg`) : clave.startsWith('K:') ? path.join(RAIZ, 'salida', 'catalogo', `m_${clave.slice(2)}.jpg`) : path.join(RAIZ, 'salida', 'cache_imagenes_web', `m_${clave}.jpg`);
  const id = fs.existsSync(ruta) ? wb.addImage({ buffer: fs.readFileSync(ruta), extension: 'jpeg' }) : undefined;
  cache.set(clave, id);
  return id;
}
const claveImagenReg = (r) => (fs.existsSync(path.join(RAIZ, 'salida', 'empaques', `m_${r.id}.jpg`)) ? `E:${r.id}` : r.refs[0]);

// ---------- ayudantes de hoja ----------
function encabezado(ws, titulo, subtitulo, ncols) {
  ws.mergeCells(1, 1, 1, ncols);
  const t = ws.getCell(1, 1); t.value = titulo; t.font = { size: 16, bold: true, color: { argb: C.blanco } }; t.fill = relleno(C.azul); t.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 32;
  ws.mergeCells(2, 1, 2, ncols);
  const s = ws.getCell(2, 1); s.value = subtitulo; s.font = { size: 10, italic: true, color: { argb: 'FF57606A' } }; s.alignment = { vertical: 'middle', wrapText: true, indent: 1 };
  ws.getRow(2).height = 34;
}
function cabeceras(ws, filaN, cols) {
  cols.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.w;
    const cell = ws.getCell(filaN, i + 1);
    cell.value = c.h; cell.font = { bold: true, size: 10, color: { argb: C.blanco } }; cell.fill = relleno(C.verde);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.border = BORDES;
  });
  ws.getRow(filaN).height = 40;
}
function seccion(ws, filaN, texto, ncols, color = C.azul) {
  ws.mergeCells(filaN, 1, filaN, ncols);
  const c = ws.getCell(filaN, 1);
  c.value = texto; c.font = { bold: true, size: 12, color: { argb: C.blanco } }; c.fill = relleno(color); c.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(filaN).height = 24;
}
function fila(ws, rN, cols, dato, n, wb, claveImg) {
  let lineas = 1;
  cols.forEach((col, i) => {
    const c = ws.getCell(rN, i + 1);
    const v = col.k(dato);
    c.value = v ?? null; c.border = BORDES; c.font = { size: 10 };
    c.alignment = { vertical: 'middle', wrapText: !!col.wrap, horizontal: col.centro ? 'center' : undefined };
    if (col.fmt) c.numFmt = col.fmt;
    if (n % 2) c.fill = relleno(C.grisClaro);
    if (col.tend && TEND[v]) { c.value = TEND[v].txt; c.fill = relleno(TEND[v].fill); c.font = { size: 10, bold: true, color: { argb: TEND[v].font } }; c.alignment = { horizontal: 'center', vertical: 'middle' }; }
    if (col.estado && v) { c.fill = relleno(v === 'Ya lo manejan' ? C.negro : v === 'Quemado' ? 'FFFFC7CE' : C.lima); c.font = { size: 10, bold: true, color: { argb: v === 'Ya lo manejan' ? C.blanco : v === 'Quemado' ? 'FF9C0006' : 'FF1E2600' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; }
    if (v && typeof v === 'object' && v.hyperlink) c.font = { size: 10, color: { argb: 'FF0563C1' }, underline: true };
    if (col.negrita) c.font = { ...c.font, bold: true, size: 11 };
    if (col.wrap && typeof v === 'string') lineas = Math.max(lineas, v.split('\n').reduce((s, t) => s + Math.max(1, Math.ceil(t.length / (col.w * 1.05))), 0));
  });
  const esEmp = /^[EK]:/.test(String(claveImg || ''));
  ws.getRow(rN).height = Math.max(esEmp ? 80 : 64, lineas * 13.5 + 6);
  const img = claveImg && imagen(wb, claveImg);
  if (img !== undefined) ws.addImage(img, { tl: { col: Math.max(0, cols.findIndex((c) => /Imagen|Envases/.test(c.h))) + 0.06, row: rN - 1 + 0.05 }, ext: esEmp ? { width: 176, height: 99 } : { width: 80, height: 80 }, editAs: 'oneCell' });
}
const imprimir = (ws, filaTitulos) => { ws.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${filaTitulos}:${filaTitulos}` }; };
const marcas = (r) => r.marcas.map((b) => b.nombre).join('\n');

const wb = new ExcelJS.Workbook();
wb.creator = 'Claude (proyecto INVIMA)';

// ===== 1. Para mandar a hacer =====
{
  const ws = wb.addWorksheet('Para mandar a hacer', { properties: { tabColor: { argb: 'FFC9D93A' } }, views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  const cols = [
    { h: '#', w: 5, k: (m) => m._n, centro: true, negrita: true },
    { h: 'Envases (ilustrativo)', w: 26, k: () => null },
    { h: 'Producto a mandar a hacer', w: 30, k: (m) => (m.titulo ? m.titulo + '\nRegistro: ' + regPorId[m.reg].n : regPorId[m.reg].n), wrap: true, negrita: true },
    { h: 'Para qué es', w: 22, k: (m) => regPorId[m.reg].ben, wrap: true },
    { h: 'Estado', w: 13, k: (m) => m.estado, estado: true },
    { h: 'Presentación', w: 13, k: (m) => regPorId[m.reg].pres, centro: true },
    { h: 'Ingredientes para el registro (dosis por porción)', w: 52, k: (m) => m.ing.map((i) => (i.d ? `• ${i.n}: ${i.d}` : `• ${i.n}`)).join('\n'), wrap: true },
    { h: 'Porción, envase y cómo se toma', w: 30, k: (m) => [m.porcion && `Porción: ${m.porcion}`, m.envase && `Envase: ${m.envase}`, m.como && `Cómo se toma: ${m.como}`].filter(Boolean).join('\n'), wrap: true },
    { h: 'Se vende hoy (productos reales)', w: 38, k: (m) => (m.marcaActual ? `Producto actual: ${m.marcaActual}${m.dropi ? ' (Dropi ' + m.dropi + ')' : ''}\n` : '') + regPorId[m.reg].refs.slice(0, 3).map((id) => prodPorId[id]).filter(Boolean).map((p) => `• ${p.n} (${paises(p.paises)}): ${fmt(p.u ?? p.w)} u.`).join('\n'), wrap: true },
    { h: 'Unidades vendidas', w: 13, k: (m) => regPorId[m.reg].us + regPorId[m.reg].mx, fmt: '#,##0' },
    { h: 'Periodo', w: 11, k: (m) => (regPorId[m.reg].periodo ? 'Últimos 28 días' : 'Septiembre 2026'), centro: true, wrap: true },
    { h: 'Marcas', w: 20, k: (m) => marcas(regPorId[m.reg]), wrap: true, negrita: true },
    { h: 'Registro', w: 9, k: (m) => m.reg, centro: true },
  ];
  encabezado(ws, 'Para mandar a hacer', 'Lista para el maquilador, en orden de prioridad: qué producto hacer, con qué ingredientes y dosis, cuánto vende hoy lo parecido en TikTok Shop y con qué marcas. Las imágenes de envases son ilustrativas.', cols.length);
  cabeceras(ws, 4, cols);
  let rN = 5, n = 0;
  for (const [titulo, lista] of [['DEL CATÁLOGO DE USTEDES · SACAR REGISTRO', D.mandar.catalogo || []], ['LÍNEA PROPIA', D.mandar.linea], ['LO MÁS VENDIDO PARA SACAR', D.mandar.top]]) {
    seccion(ws, rN++, `${titulo}  ·  ${lista.length} productos`, cols.length);
    lista.forEach((m, i) => { n++; fila(ws, rN++, cols, { ...m, _n: n }, i, wb, m.foto ? `K:${m.foto}` : claveImagenReg(regPorId[m.reg])); });
  }
  imprimir(ws, 4);
}

// ===== 2. Registros (por categoría, en orden de prioridad) =====
{
  const ws = wb.addWorksheet('Registros', { properties: { tabColor: { argb: C.verde } }, views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  const cols = [
    { h: 'Envases de las 3 marcas (ilustrativo)', w: 26, k: () => null },
    { h: 'Registro', w: 9, k: (r) => r.id, centro: true, negrita: true },
    { h: 'Qué registrar', w: 30, k: (r) => r.n, wrap: true, negrita: true },
    { h: 'Para qué es', w: 24, k: (r) => r.ben, wrap: true, negrita: true },
    { h: 'Estado', w: 13, k: (r) => estadoDe(r), estado: true },
    { h: 'Presentación', w: 13, k: (r) => r.pres, centro: true },
    { h: 'Fórmula (lo que lleva)', w: 48, k: (r) => r.ing.map((x) => `• ${x}`).join('\n'), wrap: true },
    { h: 'Se parece a estos productos virales', w: 38, k: (r) => r.refs.slice(0, 3).map((id) => prodPorId[id]).filter(Boolean).map((p) => `• ${p.n} (${paises(p.paises)})`).join('\n'), wrap: true },
    { h: 'Ventas EE. UU. (unidades)', w: 12, k: (r) => r.us, fmt: '#,##0' },
    { h: 'Ventas México (unidades)', w: 12, k: (r) => r.mx, fmt: '#,##0' },
    { h: 'Tendencia vs. agosto', w: 13, k: (r) => r.t, tend: true },
    { h: 'Marcas propuestas', w: 20, k: (r) => marcas(r), wrap: true, negrita: true },
  ];
  encabezado(ws, `Registros INVIMA · ${D.registros.length}`, 'Cada fila es UN registro sanitario (una fórmula en una presentación) y sirve para 3 marcas. Dentro de cada categoría van primero los que más podrían venderse; al final los quemados y lo que ya manejan. Ventas de septiembre de 2026 (los registros nuevos, de los últimos 28 días).', cols.length);
  cabeceras(ws, 4, cols);
  let rN = 5;
  for (const c of D.categorias) {
    const lista = D.registros.filter((r) => r.cat === c.cod);
    if (!lista.length) continue;
    seccion(ws, rN++, `${c.n}  ·  ${lista.length} ${lista.length === 1 ? 'registro' : 'registros'}`, cols.length);
    lista.forEach((r, i) => fila(ws, rN++, cols, r, i, wb, claveImagenReg(r)));
  }
  imprimir(ws, 4);
}

// ===== 3. Una hoja por categoría con los productos virales =====
for (const c of D.categorias.filter((x) => x.np)) {
  const ws = wb.addWorksheet(c.n.slice(0, 31), { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  const cols = [
    { h: 'Imagen', w: 13, k: () => null },
    { h: 'Producto', w: 38, k: (p) => p.n + (p.pubs > 1 ? `\n(${p.pubs} publicaciones unidas)` : ''), wrap: true, negrita: true },
    { h: 'Marca', w: 18, k: (p) => p.m, wrap: true },
    { h: 'País', w: 10, k: (p) => paises(p.paises), centro: true, wrap: true },
    { h: 'Para qué sirve', w: 30, k: (p) => p.s, wrap: true },
    { h: 'Ventas (unidades)', w: 12, k: (p) => p.u ?? null, fmt: '#,##0' },
    { h: 'Periodo', w: 11, k: (p) => (p.periodo ? 'Últimos 28 días' : 'Septiembre'), centro: true, wrap: true },
    { h: 'Tendencia', w: 13, k: (p) => p.t, tend: true },
    { h: 'Estado', w: 13, k: (p) => (regPorId[p.f]?.maneja ? 'Ya lo manejan' : p.t === 'quemado' ? 'Quemado' : ''), estado: true },
    { h: 'Registro', w: 26, k: (p) => (regPorId[p.f] ? `${p.f} · ${regPorId[p.f].n}` : ''), wrap: true },
    { h: 'Marcas propuestas', w: 20, k: (p) => (regPorId[p.f] ? marcas(regPorId[p.f]) : ''), wrap: true, negrita: true },
    { h: 'Ver', w: 10, k: (p) => (p.url ? { text: 'FastMoss', hyperlink: p.url } : null), centro: true },
  ];
  const lista = D.productos.filter((p) => p.cat === c.cod);
  encabezado(ws, `${c.n} · ${lista.length} productos virales`, 'Agrupados por presentación y en orden de prioridad: primero lo que más vende y crece; al final los quemados y lo que ya manejan. Los productos repetidos en varias publicaciones se unieron en una sola fila.', cols.length);
  cabeceras(ws, 4, cols);
  let rN = 5;
  const porPres = {};
  for (const p of lista) (porPres[p.v] ||= []).push(p);
  const ventas = (a) => a.reduce((s, p) => s + (p.u || 0), 0);
  const nivel = (p) => (regPorId[p.f]?.maneja ? 3 : p.nivel || 0);
  for (const v of Object.keys(porPres).sort((a, b) => ventas(porPres[b]) - ventas(porPres[a]))) {
    const g = porPres[v].sort((a, b) => nivel(a) - nivel(b) || (b.score || 0) - (a.score || 0));
    seccion(ws, rN++, `${(PLURAL[v] || v).toUpperCase()}  ·  ${g.length}`, cols.length, C.verde);
    g.forEach((p, i) => fila(ws, rN++, cols, p, i, wb, p.id));
  }
  imprimir(ws, 4);
}

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
wb.xlsx.writeFile(SALIDA).then(() => console.log('Excel escrito en', SALIDA, '·', wb.worksheets.length, 'hojas'));
