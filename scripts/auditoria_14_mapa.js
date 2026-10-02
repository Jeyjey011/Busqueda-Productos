const { cargar, datos } = require('./auditoria_lib');
(async () => {
  const { hojas } = await cargar(); const d = datos();
  const cods = ['P007','P079','P088','P010','P013','P072','P087','P134','P138','P158','P191','P140','P142','P149','P179','P215','P063','P115','P104','P105','P108','P153','P222','P230','P133','P173','P014','P070','P130','P064','P098','P220','P106','P172','P213','P218','P058','P166','P114','P137','P021','P144','P151','P180','P126'];
  for (const f of hojas['Catálogo clasificado'].filas) if (cods.includes(f['Código'])) { const c = d.clasif.get(String(f['ID TikTok'])); console.log(f['Código'], 'fila', f._fila, f['ID TikTok'], c._lote, c.categoria, c.vehiculo, c.semaforo_invima, '|', (c.presentacion||'').slice(0,40), '|', c.motivo_semaforo.slice(0,110)); }
  console.log(hojas['Plan de registros'].filas.map((f) => f.ID + '=' + f._fila).join(' '));
})();
