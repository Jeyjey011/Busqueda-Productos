# Brief: una marca única por producto

Directorio: C:\Users\PERSONAL\Documents\BUSQUEDA PRODUCTOS\repo

Somos una empresa colombiana de suplementos que vende por TikTok, Instagram y Dropi. Cada registro INVIMA (una fórmula en una presentación) se vende con **3 marcas**. Cada marca es **un producto con identidad propia**, no una línea de una marca madre. Piensa como el equipo que creó Lemme (Kourtney Kardashian), Bloom Nutrition, Goli, OLLY, Arrae, Moon Juice, Ritual, ZOA (The Rock), Poosh, Toty (Sofía Vergara) o isima (Shakira). Son marcas que la gente recuerda y que se pueden volver virales.

Los datos de cada registro están en `datos/lineas/registros.json` (registro, categoria, presentacion, producto, para_que, ingredientes). Haz SOLO los registros que te asignen.

## El nombre (lo más importante)
- Tiene que tener sentido para ESE producto: al oírlo se intuye el beneficio o la sensación. Ejemplos de lo que está MAL: un probiótico llamado "Garra", o nombres como "Pispa Drena Gotas" o "Nuara Fluida" (marca + palabra genérica). Tampoco sirven los nombres forzados o raros.
- Corto (idealmente 1 palabra de 4 a 8 letras, máximo 2 palabras), fácil de decir en Colombia y pegajoso para TikTok. Puede ser una palabra en español, en inglés, una mezcla o una palabra inventada que suene bien (como Goli, Arrae u OLLY).
- Que suene a marca de verdad, no a descripción. Nada de "Drena Gotas", "Burn Caps" ni "Magnesio Plus".
- El lenguaje es directo: si es para quemar grasa, crecer nalgas o potencia sexual, la marca y el eslogan pueden decirlo con picardía.
- Prohibido usar: Pispa, Nuara, Garra, Magnífica (ni nada parecido), ni nombres de marcas famosas que ya existen (Lemme, OLLY, Goli, Bloom, Ritual, Vital Proteins, Hims, ZOA, Toty, isima, Poosh, Moon Juice, Arrae, Nature's Bounty, Centrum, Ensure, Herbalife, Omnilife, Natrol, Windboss, etc.).
- Dentro de tu grupo no puede repetirse ningún nombre, ni siquiera parecido.

## Las 3 marcas de un registro deben ser MUY distintas
Cada una apunta a un público o ángulo diferente, el que mejor le quede al producto. Por ejemplo: una juvenil y viral (mujer Gen Z), una premium natural y de spa, y una fuerte, deportiva o masculina. En potencia sexual las tres pueden ser masculinas pero con ángulos distintos (macho y directo, pareja, premium discreto). En niños las tres son para mamás y niños. Usa el criterio que tenga más sentido para vender.
Cada marca tiene su propio diseño: paleta, tipografía y envase distintos de las otras dos.

## Formato de salida
Escribe `datos/marcas_unicas/<grupo>.json` (el nombre de grupo que te asignen), con un arreglo en el orden de los registros:
```json
[
  { "registro": "F09", "marcas": [
    {
      "nombre": "…",
      "eslogan": "frase corta en español, máximo 7 palabras",
      "descriptor": "qué es, para la etiqueta, máximo 5 palabras en español (ej. Gotas de drenaje linfático)",
      "idea": "1 frase: cómo se vende en TikTok",
      "publico": "a quién va",
      "inspiracion": "marca de figura pública que se parece (ej. Lemme de Kourtney Kardashian)",
      "paleta": ["#hex", "#hex", "#hex"],
      "fuente": "una de: Fredoka, Playfair Display, Anton, Cormorant Garamond, Bebas Neue, Pacifico, DM Serif Display, Archivo Black, Quicksand, Syne, Righteous, Baloo 2, Abril Fatface, Montserrat",
      "envase_en": "in English: the physical package (material, shape, cap, colors with hex), matching the presentation (gummies, capsules, powder, drops, tea, etc.)",
      "etiqueta_en": "in English: label design (logo style, colors with hex, graphic elements, mood)",
      "escena_en": "in English: photo set (background, surface, props, light) matching the brand mood"
    },
    { … }, { … }
  ]}
]
```
El envase debe corresponder a la presentación del registro (Gomita → frasco con gomitas; Cápsula → frasco con cápsulas; Polvo → tarro o doypack con cuchara; Gotas → gotero; Té → caja con bolsitas; Sobre/stick → caja con sticks; Líquido → botella o shot; Otro → lo que corresponda al producto).

Antes de terminar, valida con node que el JSON cargue, que haya 3 marcas por registro y que no haya nombres repetidos. Respuesta final de máximo 3 líneas: cuántos registros hiciste y 5 nombres de ejemplo.
