# Brief: nombres de línea por marca madre

Lee `datos/marcas_madre.json` (concepto, tono, regla de líneas y ejemplos de tu marca) y `datos/lineas/registros.json` (91 registros: id, categoría, presentación, producto, para qué es, ingredientes).

Para CADA uno de los 91 registros crea el producto de TU marca:
- "linea": el nombre de línea que va después del nombre de la marca (por ejemplo "Sleep" → "Pispa Sleep"). Sigue EXACTAMENTE la regla de líneas de tu marca (idioma, largo, estilo). Debe ser pegajoso, fácil de decir en Colombia, con personalidad, y decir de un vistazo para qué es.
- Las líneas NO se pueden repetir dentro de tu marca: si dos registros son parecidos (por ejemplo magnesio en cápsula y magnesio en gomita), diferéncialos con una palabra o un sufijo con sentido (por ejemplo "Sleep" y "Sleep Gummies", o "Calma" y "Calma Gotas").
- "descriptor": 2 a 5 palabras en español para la etiqueta, en lenguaje directo (por ejemplo "Gomitas para dormir", "Bebida para bajar el cortisol").
- "idea": 1 frase de venta directa, en el tono de tu marca.
- "publico": a quién le vende (corto).
Nada de nombres feos, forzados ni genéricos. Esfuérzate: estos nombres son para construir la marca a futuro.

Escribe con Write `datos/lineas/<marca>.json` (UTF-8, indentado): una lista con un objeto por registro:
{ "registro": "F01", "linea": "", "descriptor": "", "idea": "", "publico": "" }
Valida con node: 91 objetos, todos los registros presentes y ninguna "linea" repetida. Trabaja RÁPIDO (máximo unos 8 minutos), sin búsquedas web. Respuesta final: 2 líneas con 8 ejemplos.
