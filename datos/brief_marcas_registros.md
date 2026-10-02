# Brief: 3 marcas propuestas por registro

Contexto: un emprendedor colombiano va a sacar registros sanitarios INVIMA de suplementos con Guillermo (profesional de registros) y quiere 3 marcas propias por registro (un registro sanitario ampara hasta 3 marcas). Documento INTERNO. Escribe en español colombiano, directo y sin emojis.

IMPORTANTE: NO uses "MAGNIFICA", "MAGNÍFICO" ni nada parecido: es la marca de otra persona y no tiene relación con el proyecto.

Entradas:
- `datos/plan_web.json`: registros (id, nombre, categoria, presentacion, formula, descripcion, beneficio).
- `datos/marcas/*.json`: algunos registros ya tienen marcas (campo producto.registro_base = id del registro). En esos registros CONSERVA las marcas cuyo nombre NO empiece por "MAGNIF" (copia su nombre y su eslogan como "idea") y crea nombres nuevos solo para completar 3.

Para cada registro que te asignen, propón 3 marcas:
- nombres cortos (1 o 2 palabras), pegajosos, fáciles de decir en Colombia, distintos entre sí en estilo (uno juvenil para TikTok, uno premium o natural, uno popular o de barrio);
- que no sean genéricos ("Magnesio Plus") ni iguales a marcas conocidas de suplementos;
- REGLA DE NO CHOQUE: los nombres NUEVOS que inventes deben EMPEZAR por las letras que te asignen (esto evita repetidos con otros agentes que trabajan en paralelo). No repitas un nombre dentro de tu archivo. No uses los nombres que ya existen en datos/marcas/*.json salvo para conservarlos en su propio registro.
- "idea": 1 frase directa de qué es esa marca y qué promete (lenguaje directo: "quema grasa", "potencia sexual", "crece glúteos", etc.).
- "publico": a quién le vende (corto).

Salida: escribe con Write `datos/marcas_registros/parte_<N>.json` (UTF-8, indentado): una lista con un objeto por registro:
{ "registro": "F01", "marcas": [ { "nombre": "", "idea": "", "publico": "" }, { ... }, { ... } ] }
Valida con node: JSON válido, todos tus registros presentes, 3 marcas en cada uno, sin nombres repetidos y ninguno con "MAGNIF". Trabaja RÁPIDO (máximo unos 6 minutos), sin búsquedas web ni FastMoss. Respuesta final: 2 líneas.
