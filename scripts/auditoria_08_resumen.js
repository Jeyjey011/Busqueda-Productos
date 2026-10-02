const { cargar, val } = require('./auditoria_lib');
(async () => {
  const { wb } = await cargar();
  for (const n of ['Resumen', 'Fuentes y método']) {
    const ws = wb.getWorksheet(n); console.log('=====', n);
    for (let r = 1; r <= ws.rowCount; r++) {
      const vals = []; const vistos = new Set();
      ws.getRow(r).eachCell((c, i) => { if (c.isMerged && c.master !== c) return; const v = val(c.value); if (v == null) return; vals.push(typeof v === 'object' ? JSON.stringify(v) : (typeof v === 'number' ? v + (c.numFmt ? ` {${c.numFmt}}` : '') : v)); });
      if (vals.length) console.log(r, vals.join(' | '));
    }
  }
  console.log(wb.worksheets.map((w) => w.name));
})();
