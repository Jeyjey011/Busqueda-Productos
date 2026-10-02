# Brief: nombres de marca naturales (reemplazo)

El cliente dice que los nombres actuales son "raros y forzados" (por ejemplo Desinflao, Cortizero, Pufi, Bájele, Sobaquito, Gomiflow, Drenaya). Hay que REEMPLAZARLOS por nombres naturales, fáciles y creíbles, como los de una marca real de suplementos en una droguería.

Reglas para los nombres:
- Palabras reales en español (o una traducción directa al español del nombre o del gancho del producto viral en el que se basa el registro). Ejemplos del estilo buscado: "Magnesio Total", "Calma Nocturna", "Flora Íntima", "Vientre Ligero", "Fuerza Natural", "Raíz Andina", "Piel de Seda", "Noche Serena", "Ositos de Biotina", "Brillo Capilar", "Curvas Firmes", "Hombre Fuerte".
- 1 a 3 palabras. Nada inventado, nada de spanglish forzado, nada de diminutivos chistosos ni jerga ("parce", "bájele").
- Que se entienda para qué es o que suene a marca seria de suplemento.
- Los 3 nombres de un registro deben ser distintos entre sí: uno descriptivo y directo, uno más premium o natural, y uno popular pero serio.
- NO uses "MAGNIFICA" ni parecidos.
- Deben ser ÚNICOS: no repitas nombres dentro de tu archivo y evita nombres genéricos que otro agente podría usar igual (por ejemplo, no pongas solo "Colágeno": mejor "Colágeno Radiante"). Agrega un toque propio para que no choque.

Entradas: `datos/plan_web.json` (registros: id, nombre, beneficio, presentacion, formula) y tu archivo actual `datos/marcas_registros/parte_<N>.json` (mismo formato que debes devolver). Para inspirarte en traducciones de los virales, mira los nombres de los productos de cada registro en `datos/fastmoss/para_plan.json` (cruza product_id con `asignacion` de plan_web.json).

Salida: SOBRESCRIBE `datos/marcas_registros/parte_<N>.json` con la misma estructura:
[ { "registro": "F01", "marcas": [ { "nombre": "", "idea": "1 frase directa de qué es y qué promete (quemar grasa, potencia sexual, crecer glúteos, etc.)", "publico": "corto" } ×3 ] } ]
Valida con node: JSON válido, mismos registros que antes, 3 marcas por registro, sin repetidos. Trabaja RÁPIDO (máximo 6 minutos), sin búsquedas web. Respuesta final: 2 líneas con 5 ejemplos.
