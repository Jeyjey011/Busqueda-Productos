const { cargar, datos } = require('./auditoria_lib');
const TASA = 18.5;
const eq = (a, b) => (a == null && b == null) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b))) || a === b;
(async () => {
  const { hojas } = await cargar(); const d = datos();
  const H = (n) => hojas[n].filas;
  let errs = [];
  const cmp = (hoja, fila, campo, a, b) => { if (!eq(a, b)) errs.push(`${hoja} fila ${fila} ${campo}: excel=${a} json=${b}`); };
  const chk = (hoja, crudo, extraKey) => {
    const filas = H(hoja);
    filas.forEach((f, i) => {
      const p = crudo[i];
      cmp(hoja, f._fila, 'puesto', f['Puesto'], p.puesto);
      cmp(hoja, f._fila, 'titulo', f['Producto (título original)'], p.titulo);
      cmp(hoja, f._fila, 'tienda', f['Tienda'], p.tienda);
      if (hoja !== 'Lanzamientos nuevos EE. UU.') {
        cmp(hoja, f._fila, 'precio_min', f['Precio mín.'], p.precio_min); cmp(hoja, f._fila, 'precio_max', f['Precio máx.'], p.precio_max);
        cmp(hoja, f._fila, 'unid', f['Unidades del periodo'], p.unidades_periodo); cmp(hoja, f._fila, 'gmv', f['GMV del periodo'], p.gmv_periodo);
        cmp(hoja, f._fila, 'crec', f['Crecimiento vs. periodo anterior'], p.crecimiento_pct == null ? null : p.crecimiento_pct / 100);
        cmp(hoja, f._fila, 'unidTot', f['Unidades históricas'], p.unidades_totales); cmp(hoja, f._fila, 'gmvTot', f['GMV histórico'], p.gmv_total);
        cmp(hoja, f._fila, 'comision', f['Comisión afiliados'], p.comision_pct == null ? null : p.comision_pct / 100);
        const moneda = p.moneda; const fmt = f['_fmt_GMV del periodo'];
        if ((moneda === 'MXN') !== /MX\$/.test(fmt)) errs.push(`${hoja} fila ${f._fila} moneda ${moneda} formato ${fmt}`);
        if ((moneda === 'MXN') !== /MX\$/.test(f['_fmt_Precio mín.'])) errs.push(`${hoja} fila ${f._fila} precio moneda ${moneda} formato ${f['_fmt_Precio mín.']}`);
        if (hoja === 'Tendencia semana 39') cmp(hoja, f._fila, 'mercado', f['Mercado'], p.ranking.split(' ')[0]);
      } else {
        cmp(hoja, f._fila, 'precio', f['Precio'], p.precio_actual); cmp(hoja, f._fila, 'u3d', f['Unidades primeros 3 días'], p.unidades_primeros_3d);
        cmp(hoja, f._fila, 'g3d', f['GMV primeros 3 días'], p.gmv_primeros_3d); cmp(hoja, f._fila, 'unidTot', f['Unidades históricas'], p.unidades_totales);
        cmp(hoja, f._fila, 'gmvTot', f['GMV histórico'], p.gmv_total_historico);
        if (p.moneda !== 'USD') errs.push('nuevos moneda ' + p.moneda);
      }
      cmp(hoja, f._fila, 'enlace', f['Enlace'] && f['Enlace'].hyperlink, p.url_fastmoss);
      const c = d.clasif.get(String(p.product_id));
      cmp(hoja, f._fila, 'semaforo', f['Semáforo'], c.semaforo_invima);
      cmp(hoja, f._fila, 'vehiculo', f['Vehículo'], c.vehiculo);
    });
  };
  chk('Top EE. UU. sep-2026', d.us); chk('Top México sep-2026', d.mx); chk('Tendencia semana 39', d.sem); chk('Lanzamientos nuevos EE. UU.', d.nuevos);
  // catálogo
  const crudo = new Map();
  for (const p of d.us) crudo.set(String(p.product_id), { ...(crudo.get(String(p.product_id)) || {}), mes: p, base: crudo.get(String(p.product_id))?.base || p });
  for (const p of d.mx) crudo.set(String(p.product_id), { ...(crudo.get(String(p.product_id)) || {}), mes: p, base: crudo.get(String(p.product_id))?.base || p });
  for (const p of d.sem) crudo.set(String(p.product_id), { ...(crudo.get(String(p.product_id)) || {}), sem: p, base: crudo.get(String(p.product_id))?.base || p });
  for (const p of d.nuevos) crudo.set(String(p.product_id), { ...(crudo.get(String(p.product_id)) || {}), nuevo: p, base: crudo.get(String(p.product_id))?.base || p });
  const cat = H('Catálogo clasificado');
  for (const f of cat) {
    const k = String(f['ID TikTok']); const c = crudo.get(k); if (!c) { errs.push('cat sin crudo ' + k); continue; }
    cmp('Cat', f._fila, 'unid', f['Unidades sep-2026'], c.mes?.unidades_periodo ?? null);
    cmp('Cat', f._fila, 'gmv', f['GMV sep-2026 (moneda local)'], c.mes?.gmv_periodo ?? null);
    const usd = c.mes ? (c.mes.moneda === 'MXN' ? c.mes.gmv_periodo / TASA : c.mes.gmv_periodo) : null;
    cmp('Cat', f._fila, 'gmvusd', f['GMV sep-2026 (USD)'], usd);
    cmp('Cat', f._fila, 'unidsem', f['Unidades semana 39'], c.sem?.unidades_periodo ?? null);
    const m = c.base.moneda; if (f['Mercado'] === 'MX' && m !== 'MXN') errs.push('cat mercado/moneda ' + k);
    if ((m === 'MXN') !== /MX\$/.test(f['_fmt_GMV sep-2026 (moneda local)'] || '')) errs.push(`Cat ${f._fila} fmt gmv ${m} ${f['_fmt_GMV sep-2026 (moneda local)']}`);
    if (f['Precio'] && ((m === 'MXN') !== String(f['Precio']).startsWith('MX$'))) errs.push(`Cat ${f._fila} precio ${f['Precio']} ${m}`);
    const cl = d.clasif.get(k);
    for (const [col, key] of [['Semáforo INVIMA', 'semaforo_invima'], ['Vehículo', 'vehiculo'], ['Subcategoría', 'subcategoria']]) cmp('Cat', f._fila, col, f[col] || '', cl[key] || '');
    const fam = d.plan.asignacion[k] || ''; if (!(f['Familia de registro'] || '').startsWith(fam)) errs.push(`Cat ${f._fila} familia ${f['Familia de registro']} vs ${fam}`);
    // mercados mixtos en semanal
    if (c.sem && c.mes && c.sem.ranking.split(' ')[0] !== c.mes.ranking.split(' ')[0]) errs.push('mercado distinto ' + k);
    // crec
    if (c.mes) cmp('Cat', f._fila, 'crec', f['Crecimiento vs. agosto'], c.mes.crecimiento_pct == null ? null : c.mes.crecimiento_pct / 100);
  }
  // Muestra aleatoria explícita de 40 filas catálogo (impresa)
  const rnd = [...cat].sort(() => Math.random() - 0.5).slice(0, 5);
  rnd.forEach((f) => console.log('muestra', f['Código'], f['ID TikTok'], f['Unidades sep-2026'], f['GMV sep-2026 (moneda local)'], f['Precio']));
  // Plan sumas
  const plan = H('Plan de registros');
  const porFam = {};
  for (const f of cat) { const fam = (f['Familia de registro'] || '').split(' · ')[0]; if (!fam) continue; (porFam[fam] = porFam[fam] || []).push(f); }
  for (const f of plan) {
    const m = porFam[f['ID']] || [];
    const us = m.filter((p) => p['Mercado'] === 'US').reduce((s, p) => s + (p['Unidades sep-2026'] || 0), 0);
    const mx = m.filter((p) => p['Mercado'] === 'MX').reduce((s, p) => s + (p['Unidades sep-2026'] || 0), 0);
    const g = m.reduce((s, p) => s + (p['GMV sep-2026 (USD)'] || 0), 0);
    cmp('Plan', f._fila, f['ID'] + ' n', f['N.º productos en el ranking'], m.length);
    cmp('Plan', f._fila, f['ID'] + ' us', f['Unidades EE. UU.'], us); cmp('Plan', f._fila, f['ID'] + ' mx', f['Unidades México'], mx);
    cmp('Plan', f._fila, f['ID'] + ' gmv', f['GMV total (USD)'], g);
  }
  const totN = plan.reduce((s, f) => s + f['N.º productos en el ranking'], 0); console.log('suma productos en plan', totN);
  console.log('ERRORES', errs.length); console.log(errs.slice(0, 80).join('\n'));
})();
