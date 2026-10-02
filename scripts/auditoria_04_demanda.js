const { cargar, datos } = require('./auditoria_lib');
(async () => {
  const { hojas } = await cargar(); const d = datos();
  const plan = hojas['Plan de registros'].filas;
  const ord = [...plan].sort((a, b) => b['GMV total (USD)'] - a['GMV total (USD)']);
  ord.forEach((f, i) => console.log(i + 1, f['ID'], 'P' + f['Prioridad'], f['Semáforo INVIMA'], f['N.º productos en el ranking'], f['Unidades EE. UU.'], f['Unidades México'], Math.round(f['GMV total (USD)']), f['Familia de registro'].slice(0, 50)));
  console.log('\norden en hoja:', plan.map((f) => f['ID']).join(' '));
  // justificaciones: números citados vs calculados
  for (const f of plan) {
    const j = f['Justificación'] || '';
    const nums = j.match(/\d{1,3}(\.\d{3})+ unidades|\d+ productos|US\$ ?[\d,]+ ?M|EE\. UU\. [\d.]+|México [\d.]+/g);
    console.log(f['ID'], 'calc', f['Unidades EE. UU.'] + f['Unidades México'], f['Unidades EE. UU.'], f['Unidades México'], f['N.º productos en el ranking'], (f['GMV total (USD)'] / 1e6).toFixed(2), '| texto:', nums && nums.join(' ; '));
  }
  for (const id of ['1733212811552327361', '1733862220930713408', '1731774944858835650']) console.log(id, d.clasif.get(id).adaptacion_colombia);
})();
