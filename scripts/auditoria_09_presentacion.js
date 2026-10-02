// Auditoría: presentación (vacíos, inglés, tildes, URLs) — solo lectura
const { cargar, datos } = require('./auditoria_lib');
(async () => {
  const { hojas, wb } = await cargar(); const d = datos();
  // URLs vs product_id
  for (const p of [...d.us, ...d.mx, ...d.sem, ...d.nuevos]) if (!p.url_fastmoss || !p.url_fastmoss.endsWith('/' + p.product_id)) console.log('URL no coincide', p.product_id, p.url_fastmoss);
  for (const p of [...d.us, ...d.mx, ...d.sem, ...d.nuevos]) if (!/^https:\/\//.test(p.url_imagen || '')) console.log('img url rara', p.product_id, p.url_imagen);
  // Vacíos por columna
  console.log('=== Celdas vacías por columna');
  for (const [n, h] of Object.entries(hojas)) {
    for (const col of h.cab.filter(Boolean)) {
      if (['Imagen', 'Producto de referencia'].includes(col)) continue;
      const vac = h.filas.filter((f) => f[col] == null || f[col] === '');
      if (vac.length) console.log(`${n} | ${col}: ${vac.length} vacías` + (vac.length <= 8 ? ' -> ' + vac.map((f) => f['Código'] || f['Código catálogo'] || f['ID'] || f['Producto'] || f._fila).join(', ') : ''));
    }
  }
  // Inglés en columnas que deberían ir en español
  console.log('\n=== Texto en inglés (columnas en español)');
  const EN = /\b(with|and|for|the|support|supplement|powder|gummies|drops|women|men|blend|daily|boost(er)?|health|free|sugar|weight|loss|sleep|hair|skin|nails|energy|focus|bundle|pack|serving|servings|flavor|count|unflavored|liquid|capsules|tablets)\b/i;
  const colsEs = { 'Catálogo clasificado': ['Producto', 'Subcategoría', 'Presentación', 'Fórmula base', 'Ingredientes clave', 'Para qué sirve', 'Motivo del semáforo', 'Adaptación para Colombia', 'Notas'], 'Plan de registros': ['Familia de registro', 'Fórmula viral (EE. UU. / México)', 'Fórmula propuesta para Colombia', 'Ingredientes a evitar o cambiar', 'Declaraciones (claims) sugeridas', 'Justificación', 'Riesgos y pendientes', 'Marcas sugeridas (máx. 3)'], 'Anexo Ecom Magic': ['Fórmula base', 'Ingredientes clave', 'Adaptación para Colombia', 'Evidencia viral', 'Notas'], 'Ingredientes Colombia': ['Límite o condición', 'Nota'] };
  const enCnt = {};
  for (const [n, cols] of Object.entries(colsEs)) for (const f of hojas[n].filas) for (const c of cols) {
    const v = String(f[c] || ''); const m = v.match(new RegExp(EN.source, 'gi'));
    if (m) { const k = `${n}|${c}`; enCnt[k] = enCnt[k] || []; enCnt[k].push(`${f['Código'] || f['ID'] || f._fila}: ${[...new Set(m)].join(',')} «${v.slice(0, 90).replace(/\n/g, ' ')}»`); }
  }
  for (const [k, arr] of Object.entries(enCnt)) { console.log(`-- ${k}: ${arr.length}`); arr.slice(0, 12).forEach((s) => console.log('   ' + s)); }
  // Tildes faltantes
  console.log('\n=== Posibles tildes faltantes');
  const SIN = /\b(capsulas?|formulas?|acido|hialuronico|proteina|cafeina|linfatico|colageno|categoria|segun|tambien|ademas|deposito|vitaminico|metabolico|digestion|presentacion|clasificacion|declaracion|informacion|maximo|minimo|mas alto|dia|dias|via|organico|tipico|tipica|farmaceutico|regulatorio?s? |analisis|azucar|nautica|energetico|maquila |miligramos|semaforo|anos|unicos?|numero|codigo|pais|mexico|tableta?s blandas|ansiedad?|fitoterapeutico|vademecum|glucosamina|lacteo|peptidos|Peptidos|PEPTIDOS|Bebida relajante)\b/g;
  const tCnt = {};
  for (const [n, h] of Object.entries(hojas)) for (const f of h.filas) for (const c of h.cab.filter(Boolean)) {
    if (/Título|Producto \(título|Tienda|Marca|Enlace|ID/.test(c)) continue;
    const v = typeof f[c] === 'string' ? f[c] : ''; const m = v.match(SIN);
    if (m) for (const w of m) { if (/^(Bebida relajante|glucosamina|ansiedad)$/i.test(w)) continue; const k = `${n}|${c}|${w}`; tCnt[k] = (tCnt[k] || []); tCnt[k].push(f['Código'] || f['ID'] || f._fila); }
  }
  for (const [k, v] of Object.entries(tCnt)) console.log(k, v.length, v.slice(0, 6).join(','));
  // Decimales con punto en textos en español
  console.log('\n=== Números con punto decimal en texto en español (posible formato inglés)');
  const dec = {};
  for (const [n, cols] of Object.entries(colsEs)) for (const f of hojas[n].filas) for (const c of cols) {
    const v = String(f[c] || ''); const m = v.match(/\b\d+\.\d{1,2}\b(?!\.)/g);
    if (m) { const k = `${n}|${c}`; (dec[k] = dec[k] || []).push(`${f['Código'] || f['ID'] || f._fila}: ${m.join(',')}`); }
  }
  for (const [k, arr] of Object.entries(dec)) console.log(k, arr.length, arr.slice(0, 8).join(' ; '));
  // Precio texto
  const precios = hojas['Catálogo clasificado'].filas.map((f) => f['Precio']).filter(Boolean);
  console.log('\nPrecios texto ejemplo', precios.slice(0, 3), precios.filter((p) => /\.\d$/.test(p) || /\.\d –/.test(p)).slice(0, 5), 'sin precio', hojas['Catálogo clasificado'].filas.filter((f) => !f['Precio']).length);
  // Familia vacía en catálogo para no-EXC
  console.log('Cat sin familia no EXC', hojas['Catálogo clasificado'].filas.filter((f) => !f['Familia de registro'] && !/^EXC/.test(f['Categoría'])).length);
})();
