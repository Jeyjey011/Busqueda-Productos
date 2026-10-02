const ExcelJS = require('exceljs');
(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('../salida/Plan_registros_INVIMA_FastMoss_oct2026.xlsx');
  wb.eachSheet((ws) => {
    console.log('==', ws.name, 'rowCount', ws.rowCount, 'actualRowCount', ws.actualRowCount, 'cols', ws.columnCount, 'imgs', ws.getImages().length);
    for (const r of [4,5,6]) { const row = ws.getRow(r); const v=[]; row.eachCell({includeEmpty:true},(c)=>v.push(typeof c.value==='object'&&c.value?JSON.stringify(c.value).slice(0,60):String(c.value).slice(0,40))); console.log(r, v.join(' | ')); }
  });
})();
