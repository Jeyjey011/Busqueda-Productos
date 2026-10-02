// Construye el Excel final para Guillermo a partir de los datos de FastMoss,
// la clasificación de los agentes, el plan de registros y el informe regulatorio.
// Uso: node scripts/construir_excel.js
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const sharp = require('sharp');

const RAIZ = path.join(__dirname, '..');
const DIR_FM = path.join(RAIZ, 'datos', 'fastmoss');
const DIR_CACHE = path.join(RAIZ, 'salida', 'cache_imagenes');
const SALIDA = path.join(RAIZ, 'salida', 'Plan_registros_INVIMA_FastMoss_oct2026.xlsx');
const TASA_MXN = 18.5; // MXN por USD, supuesto fijo (ver hoja Fuentes y método)
const TASA_TXT = String(TASA_MXN).replace('.', ',');
const FECHA_CORTE = '2 de octubre de 2026';

// ---------- Estilo ----------
const C = {
  azul: 'FF1F3A5F', azulClaro: 'FFDCE6F1', verdeAzul: 'FF2E7D6B', gris: 'FFF2F2F2', grisBorde: 'FFD0D7DE',
  blanco: 'FFFFFFFF', texto: 'FF1F2328', textoSuave: 'FF57606A',
};
const SEMAFORO = {
  Verde: { fill: 'FFC6EFCE', font: 'FF006100' },
  Amarillo: { fill: 'FFFFEB9C', font: 'FF7F4F00' },
  Rojo: { fill: 'FFFFC7CE', font: 'FF9C0006' },
  'N/A': { fill: 'FFE7E7E7', font: 'FF57606A' },
};
// "Permitido con límite" es Verde si la dosis respeta el límite (así se aplicó a los productos)
const ESTATUS_ING = {
  'Permitido suplemento': 'Verde', 'Permitido con límite': 'Verde', 'Fitoterapéutico/Vademécum': 'Amarillo',
  'Por confirmar': 'Amarillo', Medicamento: 'Rojo', Prohibido: 'Rojo', 'No recomendado (precaución)': 'Rojo',
};
const CATEGORIAS = {
  CAB: 'Cabello, piel y uñas', COL: 'Colágeno, rostro y antiedad', BBL: 'Curvas y glúteos', PES: 'Control de peso y metabolismo',
  DIG: 'Digestión, detox e hígado', SXM: 'Libido y rendimiento masculino', SXF: 'Salud femenina, libido e íntima',
  PRO: 'Próstata y vías urinarias', SUE: 'Sueño, estrés y ánimo', ENE: 'Energía, gym y rendimiento', CER: 'Cerebro y concentración',
  INM: 'Inmunidad y multivitamínicos', ART: 'Articulaciones, huesos y movilidad', COR: 'Corazón, circulación y visión',
  NIN: 'Niños', EXC: 'No ingerible / fuera de alcance',
};
const FMT = {
  entero: '#,##0', usd: '"US$"#,##0', usd2: '"US$"#,##0.00', mxn: '"MX$"#,##0', mxn2: '"MX$"#,##0.00',
  pct: '+0.0%;-0.0%;0.0%',
};
const BORDE = { style: 'thin', color: { argb: C.grisBorde } };
const BORDES = { top: BORDE, left: BORDE, bottom: BORDE, right: BORDE };

// ---------- Utilidades de datos ----------
const leer = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const existe = (rel) => fs.existsSync(path.join(RAIZ, rel));
const catTexto = (cod) => (cod ? `${cod} · ${CATEGORIAS[cod] || ''}` : '');
const fmtMoneda = (moneda, decimales) => (moneda === 'MXN' ? (decimales ? FMT.mxn2 : FMT.mxn) : (decimales ? FMT.usd2 : FMT.usd));
const aUsd = (valor, moneda) => (valor == null ? null : moneda === 'MXN' ? valor / TASA_MXN : valor);
const pct = (v) => (v == null ? null : v / 100);

function parseCsv(texto, sep = ';') {
  const filas = []; let fila = []; let campo = ''; let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; } else if (ch === '"') comillas = false; else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) { fila.push(campo); campo = ''; } else if (ch === '\n') { fila.push(campo.replace(/\r$/, '')); filas.push(fila); fila = []; campo = ''; } else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cab, ...resto] = filas;
  return resto.filter((f) => f.length > 1).map((f) => Object.fromEntries(cab.map((k, i) => [k.replace(/^﻿/, ''), f[i]])));
}

// ---------- Carga ----------
const usMes = leer('datos/fastmoss/us_mensual_2026-09.json');
const mxMes = leer('datos/fastmoss/mx_mensual_2026-09.json');
const semanal = leer('datos/fastmoss/semanal_2026-W39.json');
const nuevos = leer('datos/fastmoss/nuevos_us_2026-09.json');
const ingredientes = leer('regulatorio/ingredientes_estatus_colombia.json');
const guiaMd = fs.readFileSync(path.join(RAIZ, 'regulatorio', 'regulatorio_invima.md'), 'utf8');
const respaldo = parseCsv(fs.readFileSync(path.join(RAIZ, 'datos', 'productos_consolidados.csv'), 'utf8'));

const clasif = new Map();
for (const f of fs.readdirSync(DIR_FM).filter((f) => /^clasificado_lote_\d+\.json$/.test(f)).sort()) {
  for (const c of JSON.parse(fs.readFileSync(path.join(DIR_FM, f), 'utf8'))) clasif.set(String(c.product_id), c);
}
const plan = existe('datos/plan_registros.json') ? leer('datos/plan_registros.json') : { familias: [], asignacion: {} };
const familias = new Map(plan.familias.map((f) => [f.familia_id, f]));
const familiaDe = (id) => plan.asignacion[id] || '';
const familiaTexto = (id) => {
  const f = familias.get(familiaDe(id));
  if (f) return `${f.familia_id} · ${f.nombre}`;
  return clasif.get(id)?.categoria === 'EXC' ? 'No aplica (fuera de alcance)' : '';
};

// Métricas por producto (una fila por product_id)
const prod = new Map();
function base(p, region) {
  const id = String(p.product_id);
  if (!prod.has(id)) {
    prod.set(id, {
      id, region, titulo: p.titulo, tienda: p.tienda, url_imagen: p.url_imagen, url_fastmoss: p.url_fastmoss,
      moneda: p.moneda, precio_min: p.precio_min ?? p.precio_actual ?? null, precio_max: p.precio_max ?? null,
      unidades_totales: p.unidades_totales, gmv_total: p.gmv_total ?? p.gmv_total_historico ?? null,
      comision: p.comision_pct, lanzamiento: p.fecha_lanzamiento, rankings: [],
    });
  }
  return prod.get(id);
}
for (const p of usMes) Object.assign(base(p, 'US'), { mes: { puesto: p.puesto, unid: p.unidades_periodo, gmv: p.gmv_periodo, crec: p.crecimiento_pct } }).rankings.push(`US sep #${p.puesto}`);
for (const p of mxMes) Object.assign(base(p, 'MX'), { mes: { puesto: p.puesto, unid: p.unidades_periodo, gmv: p.gmv_periodo, crec: p.crecimiento_pct } }).rankings.push(`MX sep #${p.puesto}`);
for (const p of semanal) {
  const region = p.ranking.split(' ')[0];
  Object.assign(base(p, region), { sem: { puesto: p.puesto, unid: p.unidades_periodo, gmv: p.gmv_periodo } }).rankings.push(`${region} sem39 #${p.puesto}`);
}
for (const p of nuevos) Object.assign(base(p, 'US'), { nuevo: { puesto: p.puesto, unid3d: p.unidades_primeros_3d, gmv3d: p.gmv_primeros_3d } }).rankings.push(`US nuevos #${p.puesto}`);

// ---------- Imágenes ----------
async function cargarImagenes(wb) {
  fs.mkdirSync(DIR_CACHE, { recursive: true });
  const ids = new Map();
  const pendientes = [...prod.values()].filter((p) => p.url_imagen);
  let fallos = 0;
  async function una(p) {
    const ruta = path.join(DIR_CACHE, `${p.id}.jpg`);
    try {
      if (!fs.existsSync(ruta)) {
        const r = await fetch(p.url_imagen, { signal: AbortSignal.timeout(30000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        await sharp(buf).resize(160, 160, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toFile(ruta);
      }
      ids.set(p.id, wb.addImage({ buffer: fs.readFileSync(ruta), extension: 'jpeg' }));
    } catch (e) { fallos++; console.warn('Imagen no disponible', p.id, e.message); }
  }
  for (let i = 0; i < pendientes.length; i += 8) await Promise.all(pendientes.slice(i, i + 8).map(una));
  console.log(`Imágenes: ${ids.size} cargadas, ${fallos} fallidas`);
  return ids;
}

// ---------- Ayudantes de hoja ----------
function titulo(ws, texto, subtitulo, ancho) {
  ws.mergeCells(1, 1, 1, ancho);
  const t = ws.getCell(1, 1);
  t.value = texto; t.font = { name: 'Calibri', size: 16, bold: true, color: { argb: C.blanco } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.azul } };
  t.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 30;
  ws.mergeCells(2, 1, 2, ancho);
  const s = ws.getCell(2, 1);
  s.value = subtitulo; s.font = { italic: true, size: 10, color: { argb: C.textoSuave } };
  s.alignment = { vertical: 'middle', wrapText: true, indent: 1 };
  ws.getRow(2).height = 32;
}

// cols: [{ h: encabezado, w: ancho, k: clave, fmt?, wrap?, grupo?, center? }]
function tabla(ws, cols, filas, { filaInicio = 4, imagenes = null, altoFila = 15, conGrupos = true } = {}) {
  let filaCab = filaInicio;
  if (conGrupos && cols.some((c) => c.grupo)) {
    // fila de grupos con celdas combinadas
    let i = 0;
    while (i < cols.length) {
      let j = i;
      while (j + 1 < cols.length && cols[j + 1].grupo === cols[i].grupo) j++;
      if (j > i) ws.mergeCells(filaInicio, i + 1, filaInicio, j + 1);
      const c = ws.getCell(filaInicio, i + 1);
      c.value = cols[i].grupo || '';
      c.font = { bold: true, size: 9, color: { argb: C.azul } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.azulClaro } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = BORDES;
      i = j + 1;
    }
    filaCab = filaInicio + 1;
  }
  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.w;
    const c = ws.getCell(filaCab, i + 1);
    c.value = col.h;
    c.font = { bold: true, color: { argb: C.blanco }, size: 10 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.verdeAzul } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = BORDES;
  });
  ws.getRow(filaCab).height = 44;

  filas.forEach((f, n) => {
    const r = filaCab + 1 + n;
    const row = ws.getRow(r);
    let lineas = 1;
    cols.forEach((col, i) => {
      const c = row.getCell(i + 1);
      let v = typeof col.k === 'function' ? col.k(f) : f[col.k];
      if (v === undefined) v = null;
      if (col.wrap && typeof v === 'string') {
        // estimación de líneas que ocupa el texto con el ancho de la columna
        const n = v.split('\n').reduce((s, seg) => s + Math.max(1, Math.ceil(seg.length / (col.w * 1.05))), 0);
        lineas = Math.max(lineas, n);
      }
      c.value = v;
      c.border = BORDES;
      c.font = { size: 10, color: { argb: C.texto } };
      c.alignment = { vertical: 'middle', wrapText: !!col.wrap, horizontal: col.center ? 'center' : undefined };
      const fmt = typeof col.fmt === 'function' ? col.fmt(f) : col.fmt;
      if (fmt) c.numFmt = fmt;
      if (n % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gris } };
      if (col.semaforo && SEMAFORO[v]) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SEMAFORO[v].fill } };
        c.font = { size: 10, bold: true, color: { argb: SEMAFORO[v].font } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (v && typeof v === 'object' && v.hyperlink) c.font = { size: 10, color: { argb: 'FF0563C1' }, underline: true };
    });
    row.height = Math.min(220, Math.max(imagenes ? 66 : altoFila, lineas * 13.5 + 6));
    if (imagenes) {
      const imgId = imagenes(f);
      if (imgId !== undefined) ws.addImage(imgId, { tl: { col: 0.08, row: r - 1 + 0.06 }, ext: { width: 82, height: 82 }, editAs: 'oneCell' });
    }
  });
  const ultima = filaCab + filas.length;
  ws.autoFilter = { from: { row: filaCab, column: 1 }, to: { row: Math.max(ultima, filaCab), column: cols.length } };
  ws.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };
  ws.pageSetup.printTitlesRow = `${filaCab}:${filaCab}`;
  ws.headerFooter = { oddFooter: '&L&8&A&R&8Página &P de &N' };
  return { filaCab, ultima };
}

function barras(ws, col, desde, hasta, color = 'FF5B9BD5') {
  if (hasta <= desde) return;
  const letra = ws.getColumn(col).letter;
  ws.addConditionalFormatting({
    ref: `${letra}${desde}:${letra}${hasta}`,
    rules: [{ type: 'dataBar', priority: 1, cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: color }, gradient: true }],
  });
}

const link = (url, texto = 'Ver en FastMoss') => (url ? { text: texto, hyperlink: url } : null);
const numEs = (v) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const precioTexto = (p) => {
  if (p.precio_min == null) return null;
  const s = p.moneda === 'MXN' ? 'MX$' : 'US$';
  return p.precio_max && p.precio_max !== p.precio_min ? `${s}${numEs(p.precio_min)} – ${numEs(p.precio_max)}` : `${s}${numEs(p.precio_min)}`;
};

// ---------- Construcción ----------
(async () => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Claude (proyecto INVIMA)';
  wb.created = new Date();
  const imgs = await cargarImagenes(wb);
  const imgDe = (id) => imgs.get(String(id));

  // Catálogo: productos con su clasificación, en orden de mercado y ventas del mes
  const catalogo = [...prod.values()].map((p) => ({ ...p, c: clasif.get(p.id) || {} }));
  catalogo.sort((a, b) => (a.region === b.region ? (b.mes?.unid ?? -1) - (a.mes?.unid ?? -1) || (b.sem?.unid ?? -1) - (a.sem?.unid ?? -1) : a.region === 'US' ? -1 : 1));
  catalogo.forEach((p, i) => { p.codigo = `P${String(i + 1).padStart(3, '0')}`; });
  const porId = new Map(catalogo.map((p) => [p.id, p]));

  // Agregados por familia
  for (const f of plan.familias) {
    const miembros = catalogo.filter((p) => familiaDe(p.id) === f.familia_id);
    f._n = miembros.length;
    f._us = miembros.filter((p) => p.region === 'US').reduce((s, p) => s + (p.mes?.unid || 0), 0);
    f._mx = miembros.filter((p) => p.region === 'MX').reduce((s, p) => s + (p.mes?.unid || 0), 0);
    f._gmvUsd = miembros.reduce((s, p) => s + (aUsd(p.mes?.gmv, p.moneda) || 0), 0);
    const top = [...miembros].sort((a, b) => (aUsd(b.mes?.gmv, b.moneda) || 0) - (aUsd(a.mes?.gmv, a.moneda) || 0));
    f._top = top;
    const vistos = new Set();
    f._refs = top.filter((p) => { const k = (p.c.nombre_corto || p.titulo).toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 4).map((p) => `${p.codigo} ${p.c.nombre_corto || p.titulo.slice(0, 50)} (${p.region})`).join('\n');
  }
  const familiasOrden = [...plan.familias].sort((a, b) => (a.prioridad - b.prioridad) || (b._gmvUsd - a._gmvUsd));

  // ===== 1. Resumen =====
  const wsR = wb.addWorksheet('Resumen', { properties: { tabColor: { argb: C.azul } }, views: [{ showGridLines: false }] });
  const wsP = wb.addWorksheet('Plan de registros', { properties: { tabColor: { argb: C.verdeAzul } }, views: [{ state: 'frozen', xSplit: 4, ySplit: 5, showGridLines: false }] });
  const wsC = wb.addWorksheet('Catálogo clasificado', { properties: { tabColor: { argb: C.verdeAzul } }, views: [{ state: 'frozen', xSplit: 4, ySplit: 5, showGridLines: false }] });
  const wsUS = wb.addWorksheet('Top EE. UU. sep-2026', { properties: { tabColor: { argb: 'FF5B9BD5' } }, views: [{ state: 'frozen', xSplit: 3, ySplit: 4, showGridLines: false }] });
  const wsMX = wb.addWorksheet('Top México sep-2026', { properties: { tabColor: { argb: 'FF5B9BD5' } }, views: [{ state: 'frozen', xSplit: 3, ySplit: 4, showGridLines: false }] });
  const wsS = wb.addWorksheet('Tendencia semana 39', { properties: { tabColor: { argb: 'FF5B9BD5' } }, views: [{ state: 'frozen', xSplit: 4, ySplit: 4, showGridLines: false }] });
  const wsN = wb.addWorksheet('Lanzamientos nuevos EE. UU.', { properties: { tabColor: { argb: 'FF5B9BD5' } }, views: [{ state: 'frozen', xSplit: 3, ySplit: 4, showGridLines: false }] });
  const wsI = wb.addWorksheet('Ingredientes Colombia', { properties: { tabColor: { argb: 'FFC00000' } }, views: [{ state: 'frozen', xSplit: 1, ySplit: 4, showGridLines: false }] });
  const wsG = wb.addWorksheet('Guía INVIMA', { properties: { tabColor: { argb: 'FFC00000' } }, views: [{ showGridLines: false }] });
  const wsA = wb.addWorksheet('Anexo Ecom Magic', { properties: { tabColor: { argb: 'FFA5A5A5' } }, views: [{ state: 'frozen', xSplit: 2, ySplit: 4, showGridLines: false }] });
  const wsF = wb.addWorksheet('Fuentes y método', { properties: { tabColor: { argb: 'FFA5A5A5' } }, views: [{ showGridLines: false }] });

  // ===== 2. Plan de registros =====
  titulo(wsP, 'Plan de registros INVIMA: familias de fórmula',
    `Cada fila es UNA fórmula base + vehículo = UN registro sanitario de suplemento dietario, que ampara hasta 3 marcas (Decreto 3863 de 2008, art. 11). El semáforo de la familia califica la fórmula propuesta para Colombia, no los productos virales. La demanda incluye productos de vehículos cercanos asignados a la familia. Ordenado por prioridad y por ventas de septiembre de 2026 en TikTok Shop (FastMoss); el GMV de México se convierte a USD a ${TASA_TXT} MXN/USD.`, 21);
  const colsP = [
    { h: 'Producto de referencia', w: 13, k: () => null, grupo: 'FAMILIA' },
    { h: 'Prioridad', w: 9, k: 'prioridad', center: true, grupo: 'FAMILIA' },
    { h: 'ID', w: 6, k: 'familia_id', center: true, grupo: 'FAMILIA' },
    { h: 'Familia de registro', w: 30, k: 'nombre', wrap: true, grupo: 'FAMILIA' },
    { h: 'Ola sugerida', w: 14, k: 'ola', wrap: true, grupo: 'FAMILIA' },
    { h: 'Categoría', w: 20, k: (f) => catTexto(f.categoria), wrap: true, grupo: 'FAMILIA' },
    { h: 'Vehículo', w: 11, k: 'vehiculo', center: true, grupo: 'FAMILIA' },
    { h: 'Tipo de registro', w: 16, k: 'tipo_registro', wrap: true, grupo: 'FAMILIA' },
    { h: 'Semáforo INVIMA', w: 11, k: 'semaforo', semaforo: true, grupo: 'REGULATORIO' },
    { h: 'Fórmula viral (EE. UU. / México)', w: 34, k: 'formula_base', wrap: true, grupo: 'REGULATORIO' },
    { h: 'Fórmula propuesta para Colombia', w: 40, k: 'formula_propuesta_colombia', wrap: true, grupo: 'REGULATORIO' },
    { h: 'Ingredientes a evitar o cambiar', w: 28, k: 'ingredientes_a_evitar', wrap: true, grupo: 'REGULATORIO' },
    { h: 'Declaraciones (claims) sugeridas', w: 34, k: 'declaraciones_sugeridas', wrap: true, grupo: 'REGULATORIO' },
    { h: 'N.º productos en el ranking', w: 11, k: '_n', fmt: FMT.entero, center: true, grupo: 'DEMANDA (sep-2026)' },
    { h: 'Unidades EE. UU.', w: 12, k: '_us', fmt: FMT.entero, grupo: 'DEMANDA (sep-2026)' },
    { h: 'Unidades México', w: 12, k: '_mx', fmt: FMT.entero, grupo: 'DEMANDA (sep-2026)' },
    { h: 'GMV total (USD)', w: 14, k: '_gmvUsd', fmt: FMT.usd, grupo: 'DEMANDA (sep-2026)' },
    { h: 'Productos de referencia (código del catálogo)', w: 40, k: '_refs', wrap: true, grupo: 'DEMANDA (sep-2026)' },
    { h: 'Marcas sugeridas (máx. 3)', w: 22, k: 'marcas_sugeridas', wrap: true, grupo: 'DECISIÓN' },
    { h: 'Justificación', w: 40, k: 'justificacion', wrap: true, grupo: 'DECISIÓN' },
    { h: 'Riesgos y pendientes', w: 36, k: 'riesgos', wrap: true, grupo: 'DECISIÓN' },
  ];
  const tp = tabla(wsP, colsP, familiasOrden, { filaInicio: 4, imagenes: (f) => { const ref = f._top.find((p) => p.c.semaforo_invima !== 'Rojo') || f._top[0]; return ref ? imgDe(ref.id) : undefined; } });
  barras(wsP, 17, tp.filaCab + 1, tp.ultima, 'FF63BE7B');

  // ===== 3. Catálogo clasificado =====
  titulo(wsC, 'Catálogo clasificado: productos virales de suplementos en TikTok Shop',
    `${catalogo.length} publicaciones únicas (por ID de TikTok) de los rankings de FastMoss (EE. UU. y México, categoría Food Supplements). Ventas de septiembre de 2026 y de la semana 39 (21–27 sep). Precios y GMV en la moneda de cada mercado; la columna GMV (USD) convierte México a ${TASA_TXT} MXN/USD. Clasificación y semáforo: preliminares, hechos por agentes; validar con asesor regulatorio.`, 33);
  const colsC = [
    { h: 'Imagen', w: 13, k: () => null, grupo: 'PRODUCTO' },
    { h: 'Código', w: 7, k: 'codigo', center: true, grupo: 'PRODUCTO' },
    { h: 'Mercado', w: 8, k: 'region', center: true, grupo: 'PRODUCTO' },
    { h: 'Producto', w: 30, k: (p) => p.c.nombre_corto || p.titulo, wrap: true, grupo: 'PRODUCTO' },
    { h: 'Marca', w: 16, k: (p) => p.c.marca || '', wrap: true, grupo: 'PRODUCTO' },
    { h: 'Tienda TikTok', w: 16, k: 'tienda', wrap: true, grupo: 'PRODUCTO' },
    { h: 'Categoría', w: 20, k: (p) => catTexto(p.c.categoria), wrap: true, grupo: 'CLASIFICACIÓN' },
    { h: 'Subcategoría', w: 20, k: (p) => p.c.subcategoria || '', wrap: true, grupo: 'CLASIFICACIÓN' },
    { h: 'Vehículo', w: 11, k: (p) => p.c.vehiculo || '', center: true, grupo: 'CLASIFICACIÓN' },
    { h: 'Presentación', w: 16, k: (p) => p.c.presentacion || '', wrap: true, grupo: 'CLASIFICACIÓN' },
    { h: 'Fórmula base', w: 34, k: (p) => p.c.formula_base || '', wrap: true, grupo: 'CLASIFICACIÓN' },
    { h: 'Ingredientes clave', w: 34, k: (p) => (p.c.ingredientes_clave || []).join('\n'), wrap: true, grupo: 'CLASIFICACIÓN' },
    { h: 'Para qué sirve', w: 30, k: (p) => p.c.para_que_sirve || '', wrap: true, grupo: 'CLASIFICACIÓN' },
    { h: 'Familia de registro', w: 26, k: (p) => familiaTexto(p.id), wrap: true, grupo: 'REGULATORIO' },
    { h: 'Semáforo INVIMA', w: 11, k: (p) => p.c.semaforo_invima || '', semaforo: true, grupo: 'REGULATORIO' },
    { h: 'Motivo del semáforo', w: 34, k: (p) => p.c.motivo_semaforo || '', wrap: true, grupo: 'REGULATORIO' },
    { h: 'Adaptación para Colombia', w: 36, k: (p) => p.c.adaptacion_colombia || '', wrap: true, grupo: 'REGULATORIO' },
    { h: 'Unidades sep-2026', w: 11, k: (p) => p.mes?.unid ?? null, fmt: FMT.entero, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'GMV sep-2026 (moneda local)', w: 14, k: (p) => p.mes?.gmv ?? null, fmt: (p) => fmtMoneda(p.moneda), grupo: 'VENTAS (FASTMOSS)' },
    { h: 'GMV sep-2026 (USD)', w: 13, k: (p) => aUsd(p.mes?.gmv, p.moneda), fmt: FMT.usd, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'Crecimiento vs. agosto', w: 11, k: (p) => pct(p.mes?.crec), fmt: FMT.pct, center: true, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'Unidades semana 39', w: 11, k: (p) => p.sem?.unid ?? null, fmt: FMT.entero, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'Unidades históricas', w: 12, k: 'unidades_totales', fmt: FMT.entero, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'Precio', w: 16, k: precioTexto, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'Comisión afiliados', w: 10, k: (p) => pct(p.comision), fmt: '0%', center: true, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'Lanzamiento', w: 11, k: 'lanzamiento', center: true, grupo: 'VENTAS (FASTMOSS)' },
    { h: 'Rankings donde aparece', w: 22, k: (p) => p.rankings.join('\n'), wrap: true, grupo: 'TRAZABILIDAD' },
    { h: 'Confianza de la fórmula', w: 11, k: (p) => p.c.confianza_formula || '', center: true, grupo: 'TRAZABILIDAD' },
    { h: 'Fuente de ingredientes', w: 22, k: (p) => p.c.fuente_ingredientes || '', wrap: true, grupo: 'TRAZABILIDAD' },
    { h: 'Notas', w: 30, k: (p) => (p.c.notas || '').replace(/d{19}/g, (id) => porId.get(id)?.codigo || id), wrap: true, grupo: 'TRAZABILIDAD' },
    { h: 'Título original', w: 40, k: 'titulo', wrap: true, grupo: 'TRAZABILIDAD' },
    { h: 'ID TikTok', w: 21, k: 'id', grupo: 'TRAZABILIDAD' },
    { h: 'Enlace', w: 15, k: (p) => link(p.url_fastmoss), grupo: 'TRAZABILIDAD' },
  ];
  const tc = tabla(wsC, colsC, catalogo, { filaInicio: 4, imagenes: (p) => imgDe(p.id) });
  barras(wsC, 20, tc.filaCab + 1, tc.ultima);

  // ===== 4–7. Rankings =====
  const colsRanking = (extra = []) => [
    { h: 'Imagen', w: 13, k: () => null },
    { h: 'Puesto', w: 7, k: 'puesto', center: true },
    { h: 'Producto (título original)', w: 46, k: 'titulo', wrap: true },
    ...extra,
    { h: 'Código catálogo', w: 9, k: (p) => porId.get(String(p.product_id))?.codigo || '', center: true },
    { h: 'Tienda', w: 18, k: 'tienda', wrap: true },
    { h: 'Categoría INVIMA', w: 20, k: (p) => catTexto(clasif.get(String(p.product_id))?.categoria), wrap: true },
    { h: 'Vehículo', w: 11, k: (p) => clasif.get(String(p.product_id))?.vehiculo || '', center: true },
    { h: 'Semáforo', w: 11, k: (p) => clasif.get(String(p.product_id))?.semaforo_invima || '', semaforo: true },
    { h: 'Familia de registro', w: 24, k: (p) => familiaTexto(String(p.product_id)), wrap: true },
  ];
  const colsVentas = [
    { h: 'Precio mín.', w: 11, k: 'precio_min', fmt: (p) => fmtMoneda(p.moneda, true) },
    { h: 'Precio máx.', w: 11, k: 'precio_max', fmt: (p) => fmtMoneda(p.moneda, true) },
    { h: 'Unidades del periodo', w: 12, k: 'unidades_periodo', fmt: FMT.entero },
    { h: 'GMV del periodo', w: 14, k: 'gmv_periodo', fmt: (p) => fmtMoneda(p.moneda) },
    { h: 'Crecimiento vs. periodo anterior', w: 12, k: (p) => pct(p.crecimiento_pct), fmt: FMT.pct, center: true },
    { h: 'Unidades históricas', w: 12, k: 'unidades_totales', fmt: FMT.entero },
    { h: 'GMV histórico', w: 14, k: 'gmv_total', fmt: (p) => fmtMoneda(p.moneda) },
    { h: 'Comisión afiliados', w: 10, k: (p) => pct(p.comision_pct), fmt: '0%', center: true },
    { h: 'Lanzamiento', w: 11, k: 'fecha_lanzamiento', center: true },
    { h: 'Enlace', w: 15, k: (p) => link(p.url_fastmoss) },
  ];
  const hojaRanking = (ws, tit, sub, filas, extra = []) => {
    const cols = [...colsRanking(extra), ...colsVentas];
    titulo(ws, tit, sub, cols.length);
    const t = tabla(ws, cols, filas, { filaInicio: 4, imagenes: (p) => imgDe(p.product_id) });
    barras(ws, cols.findIndex((c) => c.h === 'Unidades del periodo') + 1, t.filaCab + 1, t.ultima);
  };
  hojaRanking(wsUS, 'Top 100 EE. UU.: suplementos más vendidos en septiembre de 2026',
    'Fuente: FastMoss, ranking mensual de TikTok Shop EE. UU., categoría Health › Food Supplements (id 700646), ordenado por unidades vendidas en el mes. Montos en USD.', usMes);
  hojaRanking(wsMX, 'Top 100 México: suplementos más vendidos en septiembre de 2026',
    'Fuente: FastMoss, ranking mensual de TikTok Shop México, categoría Health › Food Supplements (id 700646), ordenado por unidades vendidas en el mes. Montos en pesos mexicanos (MXN).', mxMes);
  hojaRanking(wsS, 'Tendencia: top 50 por país en la semana 39 (21–27 de septiembre de 2026)',
    'Fuente: FastMoss, ranking semanal de TikTok Shop, Food Supplements. Sirve para ver qué está subiendo ahora. EE. UU. en USD y México en MXN; filtre por la columna Mercado.',
    semanal.map((p) => ({ ...p, mercado: p.ranking.split(' ')[0] })), [{ h: 'Mercado', w: 8, k: 'mercado', center: true }]);
  {
    const cols = [
      ...colsRanking(),
      { h: 'Precio', w: 11, k: 'precio_actual', fmt: FMT.usd2 },
      { h: 'Unidades primeros 3 días', w: 12, k: 'unidades_primeros_3d', fmt: FMT.entero },
      { h: 'GMV primeros 3 días', w: 12, k: 'gmv_primeros_3d', fmt: FMT.usd },
      { h: 'Unidades históricas', w: 12, k: 'unidades_totales', fmt: FMT.entero },
      { h: 'GMV histórico', w: 13, k: 'gmv_total_historico', fmt: FMT.usd },
      { h: 'Comisión afiliados', w: 10, k: (p) => pct(p.comision_pct), fmt: '0%', center: true },
      { h: 'Lanzamiento', w: 11, k: 'fecha_lanzamiento', center: true },
      { h: 'Enlace', w: 15, k: (p) => link(p.url_fastmoss) },
    ];
    titulo(wsN, 'Lanzamientos nuevos en EE. UU. (listados entre el 29 de agosto y el 28 de septiembre de 2026)',
      'Fuente: FastMoss, ranking de productos nuevos (menos de 30 días) de Food Supplements en TikTok Shop EE. UU., ordenado por unidades históricas. Señal temprana de tendencias; los volúmenes todavía son bajos.', cols.length);
    tabla(wsN, cols, nuevos, { filaInicio: 4, imagenes: (p) => imgDe(p.product_id) });
  }

  // ===== 8. Ingredientes Colombia =====
  titulo(wsI, 'Estatus de ingredientes en Colombia',
    'Preliminar, a partir de extractos de búsqueda web (los textos normativos completos no se pudieron leer). Color: verde = permitido en suplemento dietario (si tiene límite, verde mientras la dosis lo respete); amarillo = fitoterapéutico o por confirmar; rojo = medicamento, prohibido o no recomendado. Validar con asesor regulatorio.', 6);
  const colsI = [
    { h: 'Ingrediente', w: 30, k: 'ingrediente', wrap: true },
    { h: 'Estatus en Colombia', w: 20, k: 'estatus_colombia', wrap: true },
    { h: 'Semáforo', w: 11, k: (i) => ESTATUS_ING[i.estatus_colombia] || 'Amarillo', semaforo: true },
    { h: 'Límite o condición', w: 40, k: 'limite_o_condicion', wrap: true },
    { h: 'Nota', w: 60, k: 'nota', wrap: true },
    { h: 'Fuente', w: 50, k: 'fuente', wrap: true },
  ];
  const ingOrden = [...ingredientes].sort((a, b) => ['Rojo', 'Amarillo', 'Verde'].indexOf(ESTATUS_ING[a.estatus_colombia] || 'Amarillo') - ['Rojo', 'Amarillo', 'Verde'].indexOf(ESTATUS_ING[b.estatus_colombia] || 'Amarillo'));
  tabla(wsI, colsI, ingOrden, { filaInicio: 4, conGrupos: false });

  // ===== 9. Guía INVIMA (markdown a celdas) =====
  guiaHoja(wsG, guiaMd);

  // ===== 10. Anexo Ecom Magic =====
  const colsA = [
    { h: 'Producto', w: 30, k: 'nombre_producto', wrap: true },
    { h: 'Marca', w: 16, k: 'marca', wrap: true },
    { h: 'Mercado', w: 8, k: 'mercado', center: true },
    { h: 'Categoría', w: 20, k: (r) => catTexto(r.categoria), wrap: true },
    { h: 'Vehículo', w: 11, k: 'vehiculo', center: true },
    { h: 'Fórmula base', w: 36, k: 'formula_base', wrap: true },
    { h: 'Ingredientes clave', w: 36, k: (r) => (r.ingredientes_clave || '').split(' | ').join('\n'), wrap: true },
    { h: 'Semáforo', w: 11, k: 'semaforo_invima', semaforo: true },
    { h: 'Adaptación para Colombia', w: 36, k: 'adaptacion_colombia', wrap: true },
    { h: 'Ventas 30 días', w: 11, k: (r) => (r.ventas_30d ? Number(r.ventas_30d) : null), fmt: FMT.entero },
    { h: 'Evidencia viral', w: 36, k: 'evidencia_viral', wrap: true },
    { h: '¿Está en FastMoss?', w: 11, k: (r) => (porId.has(r.tiktok_product_id) ? `Sí (${porId.get(r.tiktok_product_id).codigo})` : 'No'), center: true },
    { h: 'Notas', w: 36, k: 'notas', wrap: true },
    { h: 'ID TikTok', w: 21, k: 'tiktok_product_id' },
  ];
  const respaldoUnico = respaldo.filter((r) => !r.duplicado_de_otro_archivo);
  titulo(wsA, 'Anexo: investigación previa (Ecom Magic, 2 de octubre de 2026)',
    `${respaldoUnico.length} productos investigados antes de tener acceso a FastMoss (herramienta "spy TikTok Shop" de Ecom Magic). Se conserva porque trae ingredientes y dosis investigados; la columna "¿Está en FastMoss?" indica si el producto también aparece en los rankings de FastMoss.`, colsA.length);
  tabla(wsA, colsA, respaldoUnico, { filaInicio: 4, conGrupos: false });

  // ===== 11. Fuentes y método =====
  fuentesHoja(wsF, catalogo);

  // ===== 1. Resumen (al final, cuando ya hay todos los datos) =====
  resumenHoja(wsR, catalogo, familiasOrden);

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  await wb.xlsx.writeFile(SALIDA);
  console.log('Excel escrito en', SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });

// ---------- Hojas de texto ----------
// Texto con las marcas [CONFIRMADO]/[INFERENCIA]/[POR CONFIRMAR] resaltadas en su color
function textoConMarcas(texto, base = {}) {
  const partes = texto.split(/(\[(?:CONFIRMADO|INFERENCIA|POR CONFIRMAR)[^\]]*\])/);
  if (partes.length === 1) return texto;
  return {
    richText: partes.filter(Boolean).map((t) => {
      const color = /^\[CONFIRMADO/.test(t) ? 'FF006100' : /^\[POR CONFIRMAR/.test(t) ? 'FF9C0006' : /^\[INFERENCIA/.test(t) ? 'FF9C5700' : null;
      return { text: t, font: color ? { size: 9, bold: true, color: { argb: color } } : { size: 10, ...base } };
    }),
  };
}

function guiaHoja(ws, md) {
  const ANCHO = 30; const NCOL = 6; // columnas B..G
  ws.getColumn(1).width = 3;
  for (let i = 2; i <= NCOL + 1; i++) ws.getColumn(i).width = ANCHO;
  ws.pageSetup = { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  let r = 1;
  const limpiar = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').trim();
  const lineasDe = (texto, ancho) => texto.split('\n').reduce((s, seg) => s + Math.max(1, Math.ceil(seg.length / (ancho * 1.1))), 0);
  const lineas = md.split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (/^---\s*$/.test(l) || l.trim() === '') continue;
    if (l.startsWith('|')) {
      const tablaLineas = [];
      while (i < lineas.length && lineas[i].startsWith('|')) { tablaLineas.push(lineas[i]); i++; }
      i--;
      const filas = tablaLineas.filter((t) => !/^\|\s*-/.test(t)).map((t) => t.replace(/^\||\|$/g, '').split('|').map(limpiar));
      const ncol = Math.min(NCOL, filas[0].length);
      filas.forEach((f, n) => {
        const row = ws.getRow(r);
        let maxLineas = 1;
        f.slice(0, ncol).forEach((v, j) => {
          const ultima = j === ncol - 1;
          if (ultima && ncol < NCOL) ws.mergeCells(r, j + 2, r, NCOL + 1); // la última columna usa el ancho sobrante
          const c = row.getCell(j + 2);
          c.value = n === 0 ? v : textoConMarcas(v);
          c.border = BORDES; c.alignment = { wrapText: true, vertical: 'top' };
          c.font = n === 0 ? { bold: true, color: { argb: C.blanco }, size: 10 } : { size: 10 };
          c.fill = n === 0 ? { type: 'pattern', pattern: 'solid', fgColor: { argb: C.verdeAzul } } : n % 2 === 0 ? { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gris } } : undefined;
          maxLineas = Math.max(maxLineas, lineasDe(v, ultima ? ANCHO * (NCOL - ncol + 1) : ANCHO));
        });
        row.height = Math.min(400, Math.max(18, maxLineas * 13.5 + 4));
        r++;
      });
      r++;
      continue;
    }
    ws.mergeCells(r, 2, r, NCOL + 1);
    const c = ws.getCell(r, 2);
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const nivel = h[1].length;
      c.value = limpiar(h[2]);
      if (nivel <= 2) {
        c.font = { bold: true, size: nivel === 1 ? 16 : 13, color: { argb: C.blanco } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: nivel === 1 ? C.azul : C.verdeAzul } };
        ws.getRow(r).height = nivel === 1 ? 30 : 22;
        if (nivel === 2 && r > 2) { /* espacio antes de sección */ }
      } else {
        c.font = { bold: true, size: 11, color: { argb: C.azul } };
        ws.getRow(r).height = 18;
      }
      c.alignment = { vertical: 'middle', indent: 1 };
    } else {
      let texto = limpiar(l.replace(/^>\s?/, ''));
      const sangria = (l.match(/^(\s*)/)[1].length / 2) | 0;
      if (/^\s*[-*]\s+/.test(l)) texto = '•  ' + limpiar(l.replace(/^\s*[-*]\s+/, ''));
      c.value = textoConMarcas(texto, { italic: l.startsWith('>') });
      c.font = { size: 10, color: { argb: C.texto }, italic: l.startsWith('>') };
      c.alignment = { wrapText: true, vertical: 'top', indent: 1 + sangria };
      ws.getRow(r).height = Math.min(400, Math.max(15, lineasDe(texto, ANCHO * NCOL - 6) * 13.5 + 3));
    }
    r++;
  }
}

function seccion(ws, r, texto, ancho = 8) {
  ws.mergeCells(r, 2, r, ancho);
  const c = ws.getCell(r, 2);
  c.value = texto;
  c.font = { bold: true, size: 12, color: { argb: C.blanco } };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.verdeAzul } };
  c.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(r).height = 22;
}

function parrafo(ws, r, texto, ancho = 8, alto) {
  ws.mergeCells(r, 2, r, ancho);
  const c = ws.getCell(r, 2);
  c.value = texto; c.font = { size: 10 }; c.alignment = { wrapText: true, vertical: 'top', indent: 1 };
  ws.getRow(r).height = alto || Math.max(15, Math.ceil(texto.length / 150) * 14);
}

function miniTabla(ws, r, cabeceras, filas, formatos = []) {
  cabeceras.forEach((h, j) => {
    const c = ws.getCell(r, j + 2);
    c.value = h; c.font = { bold: true, size: 10, color: { argb: C.blanco } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.azul } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = BORDES;
  });
  ws.getRow(r).height = 30;
  filas.forEach((f, n) => {
    f.forEach((v, j) => {
      const c = ws.getCell(r + 1 + n, j + 2);
      c.value = v; c.border = BORDES; c.font = { size: 10 };
      c.alignment = { vertical: 'middle', wrapText: true };
      if (formatos[j]) c.numFmt = formatos[j];
      if (SEMAFORO[v]) { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SEMAFORO[v].fill } }; c.font = { size: 10, bold: true, color: { argb: SEMAFORO[v].font } }; c.alignment = { horizontal: 'center', vertical: 'middle' }; }
      else if (n % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gris } };
    });
  });
  return r + filas.length + 2;
}

function resumenHoja(ws, catalogo, familiasOrden) {
  ws.getColumn(1).width = 3;
  [46, 16, 16, 16, 16, 16, 30].forEach((w, i) => { ws.getColumn(i + 2).width = w; });
  ws.pageSetup = { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  ws.mergeCells(1, 2, 1, 8);
  const t = ws.getCell(1, 2);
  t.value = 'Suplementos virales en TikTok Shop → plan de registros INVIMA';
  t.font = { size: 18, bold: true, color: { argb: C.blanco } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.azul } };
  t.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 36;
  ws.mergeCells(2, 2, 2, 8);
  ws.getCell(2, 2).value = `Para Guillermo · Marcas: MAGNIFICA y otras · Fecha de corte: ${FECHA_CORTE} · Datos de FastMoss (TikTok Shop EE. UU. y México)`;
  ws.getCell(2, 2).font = { italic: true, size: 10, color: { argb: C.textoSuave } };
  ws.getCell(2, 2).alignment = { indent: 1 };

  let r = 4;
  seccion(ws, r++, 'Qué es este archivo');
  parrafo(ws, r++, 'Lista los suplementos ingeribles más vendidos en TikTok Shop de EE. UU. y México en septiembre de 2026, los clasifica por fórmula base y vehículo, y los agrupa en familias de registro. En Colombia, un registro sanitario de suplemento dietario ampara una fórmula (composición + forma farmacéutica) y hasta 3 marcas. El objetivo es decidir qué registros sacar primero para cubrir el mayor número de productos virales con el menor número de trámites.', 8, 44);
  r++;

  const ingeribles = catalogo.filter((p) => p.c.es_ingerible !== false && p.c.categoria !== 'EXC');
  const kpis = [
    ['Publicaciones analizadas (únicas por ID de TikTok)', catalogo.length],
    ['   de EE. UU. / de México', `${catalogo.filter((p) => p.region === 'US').length} / ${catalogo.filter((p) => p.region === 'MX').length}`],
    ['Productos ingeribles', ingeribles.length],
    ['Familias de registro propuestas', familiasOrden.length],
    ['Registros de prioridad 1', familiasOrden.filter((f) => f.prioridad === 1).length],
    ['Ventas sep-2026 del top 100 EE. UU. (unidades)', usMes.reduce((s, p) => s + (p.unidades_periodo || 0), 0)],
    ['Ventas sep-2026 del top 100 México (unidades)', mxMes.reduce((s, p) => s + (p.unidades_periodo || 0), 0)],
  ];
  seccion(ws, r++, 'Cifras clave');
  for (const [k, v] of kpis) {
    const a = ws.getCell(r, 2); a.value = k; a.font = { size: 10 }; a.border = BORDES;
    const b = ws.getCell(r, 3); b.value = v; b.font = { bold: true, size: 11, color: { argb: C.azul } }; b.border = BORDES;
    b.alignment = { horizontal: 'right' }; if (typeof v === 'number') b.numFmt = FMT.entero;
    r++;
  }
  r++;

  if (familiasOrden.length) {
    seccion(ws, r++, 'Registros recomendados (primeros 12 según prioridad y ventas)');
    r = miniTabla(ws, r, ['Familia de registro', 'Prioridad', 'Vehículo', 'Semáforo', 'Unidades sep EE. UU.', 'Unidades sep México', 'Ola sugerida'],
      familiasOrden.slice(0, 12).map((f) => [`${f.familia_id} · ${f.nombre}`, f.prioridad, f.vehiculo, f.semaforo, f._us, f._mx, f.ola || '']),
      [null, '0', null, null, FMT.entero, FMT.entero, null]);
  }

  seccion(ws, r++, 'Productos por semáforo INVIMA (preliminar)');
  const sem = ['Verde', 'Amarillo', 'Rojo', 'N/A'].map((s) => {
    const g = catalogo.filter((p) => (p.c.semaforo_invima || 'N/A') === s);
    return [s, g.length, g.reduce((t, p) => t + (aUsd(p.mes?.gmv, p.moneda) || 0), 0)];
  });
  r = miniTabla(ws, r, ['Semáforo', 'Productos', 'GMV sep-2026 (USD)'], sem, [null, FMT.entero, FMT.usd]);

  seccion(ws, r++, 'Productos por categoría');
  const cats = Object.keys(CATEGORIAS).map((cod) => {
    const g = catalogo.filter((p) => p.c.categoria === cod);
    return [catTexto(cod), g.filter((p) => p.region === 'US').length, g.filter((p) => p.region === 'MX').length,
      g.reduce((t, p) => t + (p.mes?.unid || 0), 0), g.reduce((t, p) => t + (aUsd(p.mes?.gmv, p.moneda) || 0), 0)];
  }).filter((f) => f[1] + f[2] > 0).sort((a, b) => b[4] - a[4]);
  r = miniTabla(ws, r, ['Categoría', 'Productos EE. UU.', 'Productos México', 'Unidades sep-2026', 'GMV sep-2026 (USD)'], cats, [null, FMT.entero, FMT.entero, FMT.entero, FMT.usd]);

  seccion(ws, r++, 'Reglas regulatorias que mandan en el plan');
  for (const t of [
    '1. Un registro de suplemento dietario = una fórmula (activos y concentraciones) + una forma farmacéutica (cápsula, gomita, polvo, líquido…). Ampara hasta 3 marcas; para una cuarta marca de la misma fórmula se necesita otro registro (Decreto 3863 de 2008, art. 11).',
    '2. Cambiar un activo, su dosis o el vehículo obliga a un registro nuevo. Sabores, tamaño de envase y marca se agregan por modificación (≈ COP 0,65 millones en 2026; COP 0 para microempresa).',
    '3. Ashwagandha, Garcinia cambogia, Tribulus, yohimbe y efedra están en el listado INVIMA de plantas tóxicas (marzo 2025). Melatonina y DHEA son hormonas (no van en suplemento). Por eso varias fórmulas virales se adaptan antes de registrarlas.',
    '4. Un suplemento no puede tener claims terapéuticos ("baja de peso", "próstata", "aumenta glúteos"): solo declaraciones de la lista aceptada por INVIMA. La publicidad debe aprobarse antes.',
    '5. Todo lo regulatorio es preliminar (no se pudieron leer las normas completas). Validar con un químico farmacéutico o asesor regulatorio antes de radicar.',
  ]) parrafo(ws, r++, t, 8, 30);
  r++;

  seccion(ws, r++, 'Contenido del libro (clic para ir a cada hoja)');
  for (const [hoja, desc] of [
    ['Plan de registros', 'Una fila por registro a sacar: fórmula para Colombia, claims sugeridos, demanda, marcas y riesgos.'],
    ['Catálogo clasificado', 'Todos los productos con imagen, clasificación, semáforo, familia de registro y ventas.'],
    ['Top EE. UU. sep-2026', 'Ranking mensual de FastMoss, top 100 EE. UU.'],
    ['Top México sep-2026', 'Ranking mensual de FastMoss, top 100 México.'],
    ['Tendencia semana 39', 'Ranking semanal (21–27 sep), top 50 por país.'],
    ['Lanzamientos nuevos EE. UU.', 'Productos con menos de 30 días que ya venden.'],
    ['Ingredientes Colombia', 'Estatus de 30 ingredientes clave en Colombia.'],
    ['Guía INVIMA', 'Informe regulatorio completo: clasificación, marcas por registro, costos, tiempos, claims y rotulado.'],
    ['Anexo Ecom Magic', 'Investigación previa con ingredientes y dosis.'],
    ['Fuentes y método', 'De dónde sale cada dato y supuestos usados.'],
  ]) {
    const a = ws.getCell(r, 2); a.value = { formula: `HYPERLINK("#'${hoja}'!A1","${hoja}")`, result: hoja }; a.font = { size: 10, color: { argb: 'FF0563C1' }, underline: true };
    ws.mergeCells(r, 3, r, 8); ws.getCell(r, 3).value = desc; ws.getCell(r, 3).font = { size: 10 };
    r++;
  }
}

function fuentesHoja(ws, catalogo) {
  ws.getColumn(1).width = 3;
  for (let i = 2; i <= 8; i++) ws.getColumn(i).width = 22;
  ws.mergeCells(1, 2, 1, 8);
  const t = ws.getCell(1, 2);
  t.value = 'Fuentes, método y supuestos';
  t.font = { size: 16, bold: true, color: { argb: C.blanco } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.azul } };
  t.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 30;
  let r = 3;
  const bloques = [
    ['Datos de ventas (FastMoss)', [
      'Origen: API de FastMoss (MCP oficial con API key del usuario, plan Basic), consultada el 2 de octubre de 2026. Plataforma: TikTok Shop.',
      'Categoría: Health › Food Supplements (category_id 700646), que incluye Wellness, Beauty, Fitness y Weight Management Supplements.',
      'Rankings: mensual de septiembre de 2026 (top 100 EE. UU. y top 100 México, por unidades), semanal de la semana ISO 39 = 21–27 sep (top 50 por país) y productos nuevos de EE. UU. listados entre el 29 de agosto y el 28 de septiembre (top 30).',
      '"Crecimiento" = variación de unidades frente al periodo anterior (agosto para el ranking mensual, semana 38 para el semanal), según FastMoss.',
      'Los valores numéricos se copiaron tal cual de la API. Se verificó por duplicado la página 1 de México.',
      `Productos únicos: ${catalogo.length}. Un mismo producto puede estar en varias tiendas (por ejemplo, Windboss vende la misma fórmula en varias cuentas); cada listing cuenta por separado.`,
    ]],
    ['Supuestos', [
      `Tipo de cambio: ${TASA_TXT} MXN por USD (fijo, solo para comparar EE. UU. y México en la columna "GMV (USD)"). Los montos en moneda local son los originales.`,
      'GMV = ventas brutas estimadas por FastMoss (precio × unidades); no es utilidad ni ingreso neto del vendedor.',
    ]],
    ['Clasificación, fórmulas y semáforo', [
      'Hechas por agentes de IA a partir del título del producto, la investigación previa (Anexo Ecom Magic) y búsquedas web puntuales. La columna "Confianza de la fórmula" y la "Fuente de ingredientes" dicen qué tan sólido es cada dato.',
      'El semáforo INVIMA es preliminar: Verde = ingredientes típicos de suplemento dietario, incluidos los que tienen límite (creatina, biotina, vitaminas A/D/E/K, cafeína) cuando la dosis lo respeta; Amarillo = algún ingrediente fitoterapéutico o por confirmar, o una dosis que supera el límite (p. ej. creatina de 5 g); Rojo = medicamento, prohibido o claim imposible. No es un concepto regulatorio.',
      'Las familias de registro agrupan productos con la misma fórmula base + vehículo; algunos productos de vehículos cercanos se asignaron a la familia más parecida y suman a su demanda. La "fórmula propuesta para Colombia" es una sugerencia que debe revisar el maquilador y el asesor regulatorio.',
    ]],
    ['Información regulatoria', [
      'Sale del informe regulatorio_invima.md (hoja Guía INVIMA) y de ingredientes_estatus_colombia.json (hoja Ingredientes Colombia), elaborados con extractos de búsqueda web. Cada afirmación lleva [CONFIRMADO], [INFERENCIA] o [POR CONFIRMAR].',
      'Antes de radicar, pedir concepto de un químico farmacéutico o asesor regulatorio y revisar los listados vigentes de la Sala Especializada (SEPFSD) de INVIMA.',
    ]],
    ['Archivos de origen (repositorio Busqueda-Productos)', [
      'datos/fastmoss/us_mensual_2026-09.json · mx_mensual_2026-09.json · semanal_2026-W39.json · nuevos_us_2026-09.json (datos crudos de FastMoss)',
      'datos/fastmoss/clasificado_lote_*.json (clasificación) · datos/plan_registros.json (familias de registro) · scripts/construir_excel.js (genera este archivo)',
    ]],
  ];
  for (const [tit, lineas] of bloques) {
    seccion(ws, r++, tit);
    for (const l of lineas) parrafo(ws, r++, '•  ' + l, 8, Math.max(16, Math.ceil(l.length / 130) * 15));
    r++;
  }
}
