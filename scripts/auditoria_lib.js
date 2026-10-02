const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const leer = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const val = (v) => {
  if (v == null) return null;
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((t) => t.text).join('');
    if (v.hyperlink) return { text: v.text, hyperlink: v.hyperlink };
    if (v.result !== undefined) return v.result;
  }
  return v;
};
async function cargar() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(RAIZ, 'salida/Plan_registros_INVIMA_FastMoss_oct2026.xlsx'));
  const hojas = {};
  for (const [nombre, filaCab] of [['Plan de registros', 5], ['Catálogo clasificado', 5], ['Top EE. UU. sep-2026', 4], ['Top México sep-2026', 4], ['Tendencia semana 39', 4], ['Lanzamientos nuevos EE. UU.', 4], ['Ingredientes Colombia', 4], ['Anexo Ecom Magic', 4]]) {
    const ws = wb.getWorksheet(nombre);
    const cab = []; ws.getRow(filaCab).eachCell({ includeEmpty: true }, (c, i) => { cab[i] = val(c.value); });
    const filas = [];
    for (let r = filaCab + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r); const o = { _fila: r }; let alguno = false;
      for (let i = 1; i < cab.length; i++) { const c = row.getCell(i); const v = val(c.value); o[cab[i]] = v; o['_fmt_' + cab[i]] = c.numFmt; if (v != null && v !== '') alguno = true; }
      if (alguno) filas.push(o);
    }
    hojas[nombre] = { ws, cab, filas };
  }
  return { wb, hojas };
}
const datos = () => {
  const clasif = new Map();
  for (const f of fs.readdirSync(path.join(RAIZ, 'datos/fastmoss')).filter((f) => /^clasificado_lote_\d+\.json$/.test(f)).sort())
    for (const c of leer('datos/fastmoss/' + f)) { const k = String(c.product_id); if (clasif.has(k)) clasif.get(k)._dup = (clasif.get(k)._dup || []).concat(f); c._lote = f; clasif.set(k, c); }
  return {
    us: leer('datos/fastmoss/us_mensual_2026-09.json'), mx: leer('datos/fastmoss/mx_mensual_2026-09.json'),
    sem: leer('datos/fastmoss/semanal_2026-W39.json'), nuevos: leer('datos/fastmoss/nuevos_us_2026-09.json'),
    clasif, plan: leer('datos/plan_registros.json'), ing: leer('regulatorio/ingredientes_estatus_colombia.json'),
  };
};
module.exports = { cargar, datos, val, leer, RAIZ };
