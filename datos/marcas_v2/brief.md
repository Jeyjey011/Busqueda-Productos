# Brief v2: UNA marca fuerte por producto, 5 nombres para elegir

Directorio: C:\Users\PERSONAL\Documents\BUSQUEDA PRODUCTOS\repo

Somos una empresa colombiana de suplementos que vende por TikTok, Instagram y Dropi. Cada registro INVIMA (una fórmula en una presentación) va a tener **UNA sola marca, trabajada a fondo**, que podamos registrar y volver famosa. El cliente rechazó dos rondas por "básicas":
- Marcas madre con una palabra genérica ("Pispa Drena Gotas", "Garra Gut").
- Palabras del diccionario o diminutivos sueltos ("Popi", "Trono", "Remo", "Insu", "Mori", "Pilar").

Piensa como una agencia de branding top (la que hizo Goli, OLLY, Arrae, Lemme, Ritual, Hims, Liquid Death, Olipop, Poppi o Toty de Sofía Vergara).

## Qué hace buena a una marca aquí
- **Inventada o poco común, y que se pueda registrar.** Una palabra que nadie más usa en suplementos. Puede ser:
  - una palabra creada (Arrae, Goli, Olipop);
  - una fusión de dos ideas (Lemme = "let me");
  - una palabra extranjera con sonido latino;
  - una frase corta con actitud (Liquid Death, Sin Drama).
  
  Evita la palabra común sola.
- **Con concepto:** detrás hay una historia que se cuenta en un TikTok de 15 segundos (por qué se llama así).
- **Que suene premium y aspiracional,** no a remedio de farmacia ni a chiste fácil. Con picardía, sí; ordinaria, no.
- **Fácil de decir y recordar en Colombia:** 2 o 3 sílabas idealmente, máximo 10 letras, y que suene bien dicha por una influencer.
- **Relacionada con el beneficio o la sensación,** aunque sea de forma sugerida, no literal.
- **Prohibido:**
  - Pispa, Nuara, Garra y Magnífica, o algo parecido;
  - cualquier nombre de `datos/lineas/*.json` (campo linea) o de `datos/marcas_unicas/*.json` (campo nombre);
  - marcas famosas existentes (Lemme, OLLY, Goli, Bloom, Ritual, Hims, ZOA, Toty, isima, Poosh, Moon Juice, Arrae, Natrol, Windboss, Centrum, Herbalife, Omnilife, etc.).

## Para cada registro que te asignen
1. Lee el producto en `datos/lineas/registros.json` (registro, categoria, presentacion, producto, para_que, ingredientes).
2. Propón **5 candidatos** muy distintos entre sí, con estilos variados (inventado, fusión, frase con actitud, extranjero). Para cada uno incluye:
   - el nombre;
   - por qué se llama así (1 frase);
   - el eslogan (máximo 7 palabras, en español);
   - el tono (ej. "pícaro y juvenil", "lujo clínico").
3. Elige el mejor (`recomendada` = índice 0-4). Con WebSearch verifica en una búsqueda que ese nombre no sea ya una marca conocida de suplementos o belleza. Si lo es, elige otro y anótalo en "verificacion".
4. Diseña la identidad SOLO de la recomendada. Esto alimenta fotos premium, así que debe ser muy específico, nada genérico:
   - publico
   - inspiracion (marca real de figura pública o marca top que se le parece)
   - paleta (3-4 hex)
   - fuente (una de: Fredoka, Playfair Display, Anton, Cormorant Garamond, Bebas Neue, Pacifico, DM Serif Display, Archivo Black, Quicksand, Syne, Righteous, Baloo 2, Abril Fatface, Montserrat)
   - logo_en (en inglés: describe el logotipo como lo haría un diseñador: tipografía, forma, símbolo, detalles)
   - envase_en (en inglés: material, forma, tapa, acabado, colores hex; debe ser un envase real de suplemento acorde a la presentación)
   - etiqueta_en (en inglés: composición de la etiqueta, jerarquía, elementos gráficos, acabados como foil, emboss, holográfico)
   - escena_en (en inglés: foto de producto tipo campaña: fondo, superficie, props, luz)
   - lifestyle_en (en inglés: foto tipo TikTok o Instagram con el producto en uso, una mano o persona sin mostrar la cara, en un contexto colombiano real)

## Formato de salida
Escribe `datos/marcas_v2/<grupo>.json`:
```json
[{ "registro": "F09",
   "candidatos": [{ "nombre": "", "por_que": "", "eslogan": "", "tono": "" }, … 5],
   "recomendada": 0, "verificacion": "",
   "publico": "", "inspiracion": "", "paleta": [], "fuente": "",
   "logo_en": "", "envase_en": "", "etiqueta_en": "", "escena_en": "", "lifestyle_en": "" }]
```
Valida con node que cargue, que haya 5 candidatos por registro y que ningún candidato se repita dentro de tu archivo ni con los demás .json de datos/marcas_v2/. Usa archivos temporales con el nombre de tu grupo (ej. `tmp_<grupo>.js`) para no pisar a otros agentes. Respuesta final de máximo 3 líneas: cuántos registros hiciste y las 5 recomendadas que más te gusten.
