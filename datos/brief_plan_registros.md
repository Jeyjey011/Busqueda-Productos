# Brief para el agente planificador de registros INVIMA

Contexto: un emprendedor colombiano (marca propia MAGNIFICA y otras) va a sacar registros sanitarios INVIMA para suplementos INGERIBLES virales y venderlos por dropshipping (Dropi) en Colombia. El Excel final es para Guillermo. Escribe todo en español claro, sin jerga innecesaria.

## Reglas regulatorias que mandan (lee `regulatorio/regulatorio_invima.md`, secciones 0, 1.2, 2, 5, 6 y 8, y `regulatorio/ingredientes_estatus_colombia.json`)
- 1 registro de suplemento dietario (SD) = 1 fórmula (activos + concentraciones) + 1 forma farmacéutica o vehículo. Ampara hasta 3 marcas.
- Cambiar activo, dosis o vehículo = registro nuevo. Sabor, tamaño y marca = modificación.
- Ashwagandha, Garcinia, Tribulus, yohimbe y efedra están en el listado de plantas tóxicas; melatonina y DHEA son hormonas. Hay que adaptar esas fórmulas.
- Claims: solo declaraciones aceptadas; nada terapéutico.

## Entrada
`datos/fastmoss/para_plan.json`: un objeto por producto (ya clasificado por otros agentes), ordenado por GMV de septiembre de 2026 en USD. Campos: product_id, mercado, nombre, marca, ingerible, categoria, subcategoria, vehiculo, formula_base, ingredientes, semaforo, adaptacion, confianza, unidades_sep, gmv_sep_usd, unidades_sem39, crecimiento_pct.

## Tarea
1. Agrupa TODOS los productos ingeribles (ingerible = true y categoria ≠ EXC) en FAMILIAS DE REGISTRO: productos que, adaptados a Colombia, podrían ir sobre la MISMA fórmula + el MISMO vehículo. Normaliza: "Magnesio complejo 7 formas" y "Magnesio complejo 8 formas" en cápsula son la misma familia; la misma fórmula en gomita y en cápsula son familias distintas. Si dos fórmulas son casi iguales y una fórmula común podría cubrir a ambas, únelas y dilo en la justificación. Evita familias de 1 producto con poca venta: agrúpalas en la familia más cercana si tiene sentido, o déjalas en familias de prioridad 3.
2. Para cada familia define la fórmula propuesta para Colombia (sin ingredientes rojos; los amarillos solo si se justifican), con dosis orientativas típicas del mercado cuando las conozcas por los ingredientes (marca "orientativa" y no inventes datos de etiqueta).
3. Prioriza: 1 = sacar ya (alta demanda en EE. UU. y/o México, semáforo Verde o adaptable sin perder el atractivo, vehículo fácil de maquilar en Colombia); 2 = segunda ola; 3 = vigilar o descartar. Ten en cuenta que el negocio es dropshipping en Colombia con claims permitidos: productos cuyo atractivo depende de un claim prohibido (glúteos, "quemador", próstata, potencia sexual) bajan de prioridad o se reformulan con un ángulo permitido.
4. Apunta a entre 15 y 30 familias en total, con unas 6 a 10 de prioridad 1.

## Salida
Escribe con Write `datos/plan_registros.json` (UTF-8, indentado):
{
 "familias": [
  {
   "familia_id": "F01",            // F01, F02… en orden de prioridad y demanda
   "nombre": "Magnesio complejo en cápsula",   // corto, claro
   "categoria": "SUE",              // códigos del brief de clasificación
   "vehiculo": "Cápsula",
   "tipo_registro": "Suplemento dietario (SD)" | "Alimento (RSA/PSA/NSA)" | "SD o alimento (ver justificación)" | "Fitoterapéutico (PFT)",
   "semaforo": "Verde" | "Amarillo" | "Rojo",     // de la fórmula PROPUESTA para Colombia, no de la viral
   "formula_base": "fórmula viral típica en EE. UU./México",
   "formula_propuesta_colombia": "activos con dosis orientativas por porción",
   "ingredientes_a_evitar": "qué quitar o cambiar y por qué (corto); '' si nada",
   "declaraciones_sugeridas": "1 a 3 declaraciones del tipo permitido, p. ej. 'El magnesio contribuye al funcionamiento normal del sistema nervioso'",
   "marcas_sugeridas": "p. ej. 'MAGNIFICA + 2 marcas'",
   "prioridad": 1 | 2 | 3,
   "ola": "Ola 1 (meses 0-6)" | "Ola 2 (meses 6-12)" | "Vigilar",
   "justificacion": "por qué esta familia y esta prioridad, con el dato de demanda (2-3 frases)",
   "riesgos": "riesgos regulatorios o comerciales y qué validar (1-2 frases)"
  }
 ],
 "asignacion": { "<product_id>": "F01", ... }   // TODOS los productos ingeribles, cada uno a una familia
}
Valida con node al final: JSON válido, cada product_id ingerible de la entrada aparece en "asignacion", y cada familia_id usado existe.

Respuesta final CORTA (máx. 15 líneas): número de familias por prioridad, la lista de las de prioridad 1 (ID, nombre, vehículo, unidades US+MX), y los 3 principales riesgos del plan.
