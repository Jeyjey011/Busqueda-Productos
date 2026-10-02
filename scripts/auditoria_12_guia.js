const { cargar, val } = require('./auditoria_lib');
(async () => {
  const { wb } = await cargar();
  const ws = wb.getWorksheet('Guía INVIMA');
  let n = 0; const prob = [];
  for (let r = 1; r <= ws.rowCount; r++) ws.getRow(r).eachCell((c) => {
    if (c.isMerged && c.master !== c) return; const v = val(c.value); if (typeof v !== 'string') return; n++;
    if (/\]\(http|<br|\*|`|^#|&nbsp;|\n/.test(v)) prob.push(`${c.address}: ${v.slice(0, 120)}`);
    if (v.length > 32000) prob.push('largo ' + c.address);
    if (ws.getRow(r).height >= 399) prob.push(`fila ${r} con alto máximo (posible texto cortado) ${v.length} chars`);
  });
  console.log('celdas', n); console.log(prob.slice(0, 30).join('\n'));
  // primeras líneas
  for (let r = 1; r <= 3; r++) console.log(r, val(ws.getCell(r, 2).value));
  // altura máxima en Plan/catálogo (220) y textos largos que podrían quedar cortados
  for (const name of ['Plan de registros', 'Catálogo clasificado']) {
    const w = wb.getWorksheet(name); let c = 0; for (let r = 6; r <= w.rowCount; r++) if (w.getRow(r).height >= 220) c++; console.log(name, 'filas con alto tope 220:', c);
  }
})();
