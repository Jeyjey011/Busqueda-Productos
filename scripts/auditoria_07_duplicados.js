// Auditoría: listings del mismo producto con clasificación distinta (solo lectura)
const { cargar, datos } = require('./auditoria_lib');
(async () => {
  const { hojas } = await cargar(); const d = datos();
  const cat = hojas['Catálogo clasificado'].filas;
  const norm = (t) => t.toLowerCase().replace(/【[^】]*】|\[[^\]]*\]/g, '').replace(/[^a-z0-9áéíóúñ]/g, '').slice(0, 45);
  const grupos = {};
  for (const f of cat) (grupos[norm(f['Título original'])] = grupos[norm(f['Título original'])] || []).push(f);
  for (const arr of Object.values(grupos)) {
    if (arr.length < 2) continue;
    for (const campo of ['Categoría', 'Vehículo', 'Semáforo INVIMA', 'Familia de registro', 'Subcategoría', 'Fórmula base']) {
      const vals = new Set(arr.map((f) => f[campo]));
      if (vals.size > 1) console.log(`[${campo}] ${arr.map((f) => f['Código'] + '=' + String(f[campo]).slice(0, 60)).join(' | ')}`);
    }
  }
  // Productos concretos
  for (const cod of ['P219', 'P115', 'P063', 'P070', 'P130', 'P014', 'P104', 'P105', 'P108', 'P207', 'P166']) {
    const f = cat.find((x) => x['Código'] === cod);
    console.log('\n' + cod, f['Producto'], '|', f['Categoría'], '|', f['Vehículo'], '|', f['Presentación'], '|', f['Semáforo INVIMA'], '\n  FB:', f['Fórmula base'], '\n  ING:', f['Ingredientes clave'], '\n  MOT:', f['Motivo del semáforo'], '\n  NOT:', f['Notas']);
  }
})();
