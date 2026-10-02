// Aplica a los JSON las correcciones de datos/auditoria_excel.md (2 de octubre de 2026).
// Es idempotente: se puede volver a ejecutar sin duplicar cambios.
// Uso: node scripts/correcciones_auditoria.js
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const rutaLote = (n) => path.join(RAIZ, 'datos', 'fastmoss', `clasificado_lote_${n}.json`);
const lotes = [1, 2, 3, 4].map((n) => ({ n, datos: JSON.parse(fs.readFileSync(rutaLote(n), 'utf8')) }));
const prod = (id) => {
  for (const l of lotes) { const c = l.datos.find((x) => String(x.product_id) === id); if (c) return c; }
  throw new Error(`No existe el producto ${id}`);
};
const rutaPlan = path.join(RAIZ, 'datos', 'plan_registros.json');
const plan = JSON.parse(fs.readFileSync(rutaPlan, 'utf8'));
const fam = (id) => plan.familias.find((f) => f.familia_id === id);
const rutaIng = path.join(RAIZ, 'regulatorio', 'ingredientes_estatus_colombia.json');
const ingredientes = JSON.parse(fs.readFileSync(rutaIng, 'utf8'));
const log = [];
const cambiar = (obj, campo, valor, ref) => { if (obj[campo] !== valor) { obj[campo] = valor; log.push(`${ref}.${campo}`); } };

// A2: creatinas de 5 g por porción → Amarillo (el tope de referencia es 3 g/día)
const MOTIVO_CREATINA = 'La creatina es ingrediente de suplemento dietario, pero 5 g por porción supera el tope de 3 g/día; hay que bajar la dosis para registrarla.';
for (const id of ['1732376373883998234', '1734908639111316696', '1731792010987210968', '1734303279583364312']) {
  const c = prod(id);
  cambiar(c, 'semaforo_invima', 'Amarillo', id);
  if (!/supera/.test(c.motivo_semaforo || '')) cambiar(c, 'motivo_semaforo', MOTIVO_CREATINA, id);
}

// M1: mismo producto con semáforo distinto según la publicación → Amarillo (criterio de la mayoría)
for (const id of ['1729890372836496007', '1729698659696480903', '1735722147718857972', '1735722965679375604', '1734151946164930270', '1732495425519259779']) {
  cambiar(prod(id), 'semaforo_invima', 'Amarillo', id);
}
const LEEFAR_MOTIVO = prod('1734572167779485527').motivo_semaforo; // publicación de LeeFar ya en Amarillo
for (const id of ['1729890372836496007', '1729698659696480903', '1735722147718857972', '1735722965679375604']) {
  if (/leefar|ioho|her juicy/i.test(prod(id).nombre_corto + prod(id).marca)) cambiar(prod(id), 'motivo_semaforo', LEEFAR_MOTIVO, id);
}
{
  const mentas = prod('1732495425519259779');
  const chicle = prod('1729413266549936259');
  cambiar(mentas, 'categoria', chicle.categoria, '1732495425519259779');
  cambiar(mentas, 'motivo_semaforo', chicle.motivo_semaforo, '1732495425519259779');
}

// M5: snacks fuera de alcance → N/A
for (const id of ['1732504769622610930', '1732494729808286706', '1732614288251719922']) {
  const c = prod(id);
  cambiar(c, 'semaforo_invima', 'N/A', id);
  cambiar(c, 'motivo_semaforo', 'Alimento común (snack); no aplica como suplemento dietario.', id);
}

// M7: mismo combo WindBoss Cortisol + Myo-Inositol → misma categoría y vehículo
for (const id of ['1734892603444921471', '1731794003849414783', '1734678914932180800', '1734639306450044736']) {
  cambiar(prod(id), 'categoria', 'SUE', id);
  cambiar(prod(id), 'vehiculo', 'Cápsula', id);
}

// B3: clasificaciones discutibles
cambiar(prod('1729409703327011501'), 'categoria', 'COL', '1729409703327011501'); // astaxantina
if (plan.asignacion['1729409703327011501'] !== 'F25') { plan.asignacion['1729409703327011501'] = 'F25'; log.push('asignacion.P070→F25'); }
for (const l of lotes) {
  for (const c of l.datos) {
    if (/nitric oxide|óxido nítrico/i.test(c.nombre_corto) && c.categoria === 'SXM') cambiar(c, 'categoria', 'COR', c.product_id);
  }
}

// B5: celdas vacías
cambiar(prod('1732516846911787527'), 'marca', 'Sin marca visible', '1732516846911787527');

// M9 y B12: jerga interna y anglicismos en textos que lee el cliente
const reemplazos = [
  [/el JSON regulatorio/gi, 'la hoja Ingredientes Colombia'], [/del JSON regulatorio/gi, 'de la hoja Ingredientes Colombia'],
  [/en el JSON( de ingredientes)?/gi, 'en la hoja Ingredientes Colombia'], [/el JSON( de ingredientes)?/gi, 'la hoja Ingredientes Colombia'],
  [/según JSON/gi, 'según la hoja Ingredientes Colombia'], [/\bJSON\b/g, 'hoja Ingredientes Colombia'],
  [/\bel respaldo\b/gi, 'el Anexo Ecom Magic'], [/\bdel respaldo\b/gi, 'del Anexo Ecom Magic'], [/\ben respaldo\b/gi, 'en el Anexo Ecom Magic'],
  [/\brespaldo\b/gi, 'Anexo Ecom Magic'],
  [/\bbundles\b/gi, 'kits'], [/\bbundle\b/gi, 'kit'], [/\blistings\b/gi, 'publicaciones'], [/\blisting\b/gi, 'publicación'],
  [/\bslug\b/gi, 'URL'], [/\bsalePrice\b/g, 'precio de venta'], [/\bpacks\b/gi, 'paquetes'], [/\bpack\b/gi, 'paquete'],
];
const limpiar = (t) => reemplazos.reduce((s, [re, r]) => s.replace(re, r), t);
for (const l of lotes) {
  for (const c of l.datos) {
    for (const campo of ['motivo_semaforo', 'notas', 'presentacion', 'adaptacion_colombia']) {
      if (typeof c[campo] === 'string') cambiar(c, campo, limpiar(c[campo]).replace(/hoja Ingredientes Colombia regulatorio/g, 'hoja Ingredientes Colombia'), c.product_id);
    }
    if (typeof c.fuente_ingredientes === 'string') {
      cambiar(c, 'fuente_ingredientes', c.fuente_ingredientes.replace(/^WebSearch:/i, 'Búsqueda web:').replace(/^Respaldo Ecom Magic$/i, 'Anexo Ecom Magic'), c.product_id);
    }
  }
}

// Plan: A1, M3, M4, M8, B4, B5, B11, B13
cambiar(fam('F24'), 'declaraciones_sugeridas', 'El zinc contribuye al metabolismo normal de los macronutrientes; La vitamina B12 contribuye a disminuir el cansancio y la fatiga (verificar textos en el listado de declaraciones aceptadas).', 'F24');
cambiar(fam('F24'), 'semaforo', 'Amarillo', 'F24');
cambiar(fam('F24'), 'nombre', 'Vitalidad masculina con maca y zinc (reformular o descartar)', 'F24');
cambiar(fam('F14'), 'declaraciones_sugeridas', 'La vitamina B6 contribuye a disminuir el cansancio y la fatiga; El magnesio contribuye al funcionamiento normal del sistema nervioso; La vitamina D contribuye al funcionamiento normal del sistema inmunitario (verificar textos).', 'F14');
cambiar(fam('F13'), 'ingredientes_a_evitar', 'Berberina (por confirmar), cúrcuma como activo (fitoterapéutico), gymnema y melón amargo (sin estatus confirmado), cetonas de frambuesa y cafeína alta. Nada de "keto burn", "controla la diabetes" ni "baja el azúcar"; solo la declaración aceptada del cromo, tal cual.', 'F13');
for (const [id, viejo, nuevo] of [
  ['F06', 'como producto n.º 2 del listado', 'como n.º 2 del listado por GMV (puesto 5 por unidades)'],
  ['F04', 'que es el producto n.º 4 del listado', 'que es el n.º 4 del listado por GMV (puesto 7 por unidades)'],
]) cambiar(fam(id), 'justificacion', fam(id).justificacion.replace(viejo, nuevo), id);
if (!/spray/.test(fam('F02').riesgos)) cambiar(fam('F02'), 'riesgos', fam('F02').riesgos + ' Los kits que incluyen un spray íntimo (cosmético) no entran en este registro.', 'F02');
if (!fam('F21').ingredientes_a_evitar) cambiar(fam('F21'), 'ingredientes_a_evitar', 'Ninguno; solo ajustar la biotina y las vitaminas a los máximos permitidos.', 'F21');
cambiar(fam('F29'), 'tipo_registro', 'No aplica (descartar)', 'F29');
if (!/antes que F11/.test(fam('F08').justificacion)) cambiar(fam('F08'), 'justificacion', fam('F08').justificacion + ' Va antes que F11 y F12, que venden más, porque es Verde sin reformular, usa cápsula estándar y no depende de claims delicados.', 'F08');
for (const id of ['F15', 'F10']) {
  const f = fam(id);
  if (!/opcional/.test(f.declaraciones_sugeridas)) cambiar(f, 'declaraciones_sugeridas', f.declaraciones_sugeridas.replace(/\s*$/, '') + ' (las declaraciones de corazón o glucosa son opcionales y con riesgo de objeción: validar antes de usarlas).', id);
}

// B10: NAC y kava en la base de ingredientes
const agregar = (ing) => { if (!ingredientes.some((i) => i.ingrediente === ing.ingrediente)) { ingredientes.push(ing); log.push(`ingrediente ${ing.ingrediente}`); } };
agregar({
  ingrediente: 'NAC (N-acetilcisteína)', estatus_colombia: 'Medicamento', limite_o_condicion: 'No usar en suplemento dietario',
  nota: 'En Colombia la acetilcisteína se comercializa como medicamento (mucolítico). [INFERENCIA] Confirmar en las normas farmacológicas vigentes.',
  fuente: 'Práctica de mercado colombiano (productos con registro de medicamento); por confirmar con asesor regulatorio',
});
agregar({
  ingrediente: 'Kava (Piper methysticum)', estatus_colombia: 'No recomendado (precaución)', limite_o_condicion: 'No usar hasta confirmar',
  nota: 'No se encontró su estatus en Colombia. Se trata como Rojo por precaución: tiene antecedentes de hepatotoxicidad y está restringida en varios países. [POR CONFIRMAR]',
  fuente: 'Sin fuente colombiana; criterio de precaución del proyecto',
});

for (const l of lotes) fs.writeFileSync(rutaLote(l.n), JSON.stringify(l.datos, null, 1), 'utf8');
fs.writeFileSync(rutaPlan, JSON.stringify(plan, null, 1), 'utf8');
fs.writeFileSync(rutaIng, JSON.stringify(ingredientes, null, 2), 'utf8');
console.log(`${log.length} cambios aplicados`);
