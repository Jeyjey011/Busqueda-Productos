const { datos } = require('./auditoria_lib');
const d = datos();
const PC = { berberina: /berberin/i, '5-HTP': /5-?HTP/i, shilajit: /shilajit/i, tongkat: /tongkat/i, 'saw palmetto': /saw palmetto|serenoa/i, 'NAD/NMN': /\bNMN\b|NAD\+|nicotinamida ribós|ribósido/i, glutatión: /glutati/i, 'sea moss': /sea moss|musgo marino/i, fenogreco: /fenogreco|fenugreek/i, aguaje: /aguaje/i, cúrcuma: /c[uú]rcuma|turmeric|curcumin/i };
const LIM = { creatina: /creatin/i, cafeína: /cafe[ií]na|caffeine/i, hierro: /\bhierro\b|\biron\b/i, biotina: /biotin/i, 'vit D/A/E/K': /vitamina (D|A|E|K)|\bD3\b|\bK2\b/i };
const out = { pc: [], lim: {} };
for (const c of d.clasif.values()) {
  const t = [c.formula_base, ...(c.ingredientes_clave || [])].join(' | ');
  if (c.semaforo_invima === 'Verde') {
    const h = Object.entries(PC).filter(([, re]) => re.test(t)).map(([k]) => k);
    if (h.length) out.pc.push(`${c.product_id} ${c.nombre_corto} -> ${h} | ${t.slice(0, 160)}`);
    for (const [k, re] of Object.entries(LIM)) if (re.test(t)) (out.lim[k] = out.lim[k] || []).push(c.nombre_corto);
  }
}
console.log('Verde con ingrediente "Por confirmar"/fitoterapéutico:\n' + out.pc.join('\n'));
for (const [k, v] of Object.entries(out.lim)) console.log(`Verde con ${k} (con límite): ${v.length}`);
