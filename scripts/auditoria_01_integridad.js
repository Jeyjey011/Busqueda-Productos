const { cargar, datos } = require('./auditoria_lib');
(async () => {
  const { hojas } = await cargar(); const d = datos();
  const H = (n) => hojas[n].filas;
  for (const n of Object.keys(hojas)) console.log(n, H(n).length);
  // catálogo
  const cat = H('Catálogo clasificado');
  const cods = cat.map((p) => p['Código']); const ids = cat.map((p) => String(p['ID TikTok']));
  console.log('códigos únicos', new Set(cods).size, 'ids únicos', new Set(ids).size);
  // ids en crudos
  const todos = new Set([...d.us, ...d.mx, ...d.sem, ...d.nuevos].map((p) => String(p.product_id)));
  console.log('ids únicos crudos', todos.size, 'clasificados', d.clasif.size);
  console.log('crudos sin clasificar', [...todos].filter((i) => !d.clasif.has(i)));
  console.log('clasificados no en crudos', [...d.clasif.keys()].filter((i) => !todos.has(i)));
  console.log('duplicados en lotes', [...d.clasif.values()].filter((c) => c._dup).map((c) => c.product_id + ' ' + c._lote + ' ' + c._dup));
  // duplicados dentro de cada ranking
  for (const [n, a] of [['us', d.us], ['mx', d.mx], ['sem', d.sem], ['nuevos', d.nuevos]]) {
    const s = new Set(a.map((p) => p.product_id)); console.log('ranking', n, a.length, 'únicos', s.size);
    const puestos = a.map((p) => p.puesto); if (n === 'sem') { for (const reg of ['US', 'MX']) { const pp = a.filter((p) => p.ranking.startsWith(reg)).map((p) => p.puesto); console.log(' sem', reg, pp.length, Math.min(...pp), Math.max(...pp), new Set(pp).size); } } else console.log(' puestos', Math.min(...puestos), Math.max(...puestos), new Set(puestos).size);
    // orden por unidades
    let des = 0; for (let i = 1; i < a.length; i++) if (n !== 'sem' && (a[i].unidades_periodo ?? a[i].unidades_totales) > (a[i - 1].unidades_periodo ?? a[i - 1].unidades_totales)) des++; console.log(' fuera de orden', des);
  }
  // Mismos títulos con distintos ids (duplicados de listing)
  // Asignación del plan
  const asig = d.plan.asignacion; const fams = new Set(d.plan.familias.map((f) => f.familia_id));
  console.log('asignados', Object.keys(asig).length, 'familias', fams.size);
  console.log('asignados a familia inexistente', Object.entries(asig).filter(([k, v]) => !fams.has(v)));
  console.log('asignados no en catálogo', Object.keys(asig).filter((k) => !todos.has(k)));
  const sinAsig = [...todos].filter((i) => !asig[i]);
  console.log('sin asignar', sinAsig.map((i) => { const c = d.clasif.get(i) || {}; return `${i} ${c.categoria} ${c.es_ingerible} ${c.nombre_corto}`; }));
  console.log('EXC asignados a familia', [...d.clasif.values()].filter((c) => (c.categoria === 'EXC' || c.es_ingerible === false) && asig[c.product_id]).map((c) => c.product_id + ' ' + c.nombre_corto + ' -> ' + asig[c.product_id]));
  console.log('familias sin miembros', [...fams].filter((f) => !Object.values(asig).includes(f)));
})();
