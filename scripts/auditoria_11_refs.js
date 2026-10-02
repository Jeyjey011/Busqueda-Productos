const { cargar } = require('./auditoria_lib');
(async () => {
  const { hojas } = await cargar();
  const cat = new Map(hojas['Catálogo clasificado'].filas.map((f) => [f['Código'], f]));
  for (const f of hojas['Plan de registros'].filas) {
    const cods = (f['Productos de referencia (código del catálogo)'] || '').split('\n').map((l) => l.split(' ')[0]);
    const s = cods.map((c) => `${c}:${cat.get(c)['Semáforo INVIMA']}:${cat.get(c)['Vehículo']}`);
    const first = cat.get(cods[0]);
    const flag = f['Semáforo INVIMA'] !== 'Rojo' && first['Semáforo INVIMA'] === 'Rojo' ? '  <-- referencia principal (imagen) es Rojo' : '';
    console.log(f.ID, f['Semáforo INVIMA'], f['Vehículo'], s.join(' '), flag);
  }
  const an = hojas['Anexo Ecom Magic'].filas.filter((f) => /\d{19}/.test(f['Marca'] || '')); an.forEach((f) => console.log('Anexo marca', f._fila, f['Producto'], '|', f['Marca']));
})();
