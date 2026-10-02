const { cargar } = require('./auditoria_lib');
(async () => {
  const { hojas } = await cargar();
  const RE = /\bJSON\b|\blote\b|\bagente|respaldo|\bslug\b|salePrice|\bWebSearch\b|\b\d{19}\b/g;
  const cnt = {};
  for (const [n, h] of Object.entries(hojas)) for (const f of h.filas) for (const c of h.cab.filter(Boolean)) {
    if (/ID TikTok|Enlace|Título/.test(c)) continue;
    const v = typeof f[c] === 'string' ? f[c] : ''; const m = v.match(RE);
    if (m) for (const w of new Set(m.map((x) => (/^\d{19}$/.test(x) ? '<id19>' : x)))) { const k = `${n} | ${c} | ${w}`; cnt[k] = (cnt[k] || 0) + 1; }
  }
  console.log(cnt);
  const p = hojas['Plan de registros'].filas.find((f) => f.ID === 'F19'); console.log(p['Justificación']);
  const ing = hojas['Ingredientes Colombia'].filas; [14, 25, 33, 34].forEach((r) => { const f = ing.find((x) => x._fila === r); console.log(r, f && f['Fuente']); });
  // Fuente de ingredientes con URL (texto, no hipervínculo)
  console.log(hojas['Catálogo clasificado'].filas.filter((f) => /^WebSearch/.test(f['Fuente de ingredientes'] || '')).length, 'filas con "WebSearch: url" en Fuente de ingredientes');
  // Plan: products de referencia col
  console.log(hojas['Plan de registros'].filas.slice(0, 2).map((f) => f['Productos de referencia (código del catálogo)']));
  // Guía INVIMA: buscar texto en inglés/jerga
})();
