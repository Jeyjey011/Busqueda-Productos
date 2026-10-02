const { cargar } = require('./auditoria_lib');
(async () => {
  const { hojas } = await cargar();
  for (const f of hojas['Catálogo clasificado'].filas) console.log([f['Código'], f['Mercado'], (f['Categoría'] || '').slice(0, 3), f['Vehículo'], f['Semáforo INVIMA'], (f['Familia de registro'] || '-').slice(0, 3), (f['Subcategoría'] || '').slice(0, 30), '|', (f['Título original'] || '').slice(0, 95)].join(' '));
})();
