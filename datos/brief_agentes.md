# BRIEF COMÚN PARA AGENTES INVESTIGADORES DE PRODUCTO

Contexto: un emprendedor colombiano (marca propia MAGNIFICA y otras) va a sacar registros sanitarios INVIMA para productos de bienestar INGERIBLES y venderlos por dropshipping (Dropi) en Colombia. En Colombia un registro sanitario ampara una FÓRMULA (composición + forma farmacéutica/vehículo); varias marcas pueden ir sobre el mismo registro si la composición es idéntica. Por eso necesitamos detectar productos virales en EE. UU. y México y agruparlos por FÓRMULA BASE + VEHÍCULO.

## Herramientas
1. FUENTE PRINCIPAL — TikTok Shop (datos tipo FastMoss): herramienta MCP `mcp__ECOM_MAGIC__spy_tiktok_shop_search` (cárgala con ToolSearch: "select:mcp__ECOM_MAGIC__spy_tiktok_shop_search,mcp__ECOM_MAGIC__jobs_get"). Es GRATIS para esta cuenta. Llama con {"query": "<keyword en inglés para US / español para MX>", "region": "US" o "MX", "pages": 1}. NO pongas `sort` ni pages>1 (se cuelga). Devuelve job_id → consulta `mcp__ECOM_MAGIC__jobs_get` cada pocos segundos hasta status=succeeded (tarda ~20-40 s). Si tras ~12 consultas sigue "running", abandónalo y sigue con otra keyword. Puedes lanzar varias búsquedas a la vez (encola 3-4 jobs y luego consulta). Cada resultado trae: title, image (URL), images[], salePrice, sales30d, gmv30d, soldCount (total), totalGmv, rating, reviewCount, productId, region.
2. WebSearch para: completar ingredientes/dosis de la etiqueta (Supplement Facts), confirmar para qué sirve, rankings de FastMoss/Kalodata publicados (blogs, notas de prensa), Amazon best sellers, Mercado Libre México. OJO: WebFetch y curl están BLOQUEADOS por la red; solo funciona WebSearch y las herramientas MCP.
3. No uses Bash para internet.

## Qué entregar
Mínimo 22 y máximo 35 productos DISTINTOS (no repitas el mismo producto en bundles/2-packs; quédate con el listing de más ventas), cubriendo TODAS las subcategorías asignadas y TODOS los vehículos que encuentres (cápsula, softgel, tableta, gomita, polvo, líquido/shot, gotas, té, sachet/stick, efervescente). Prioriza por ventas reales (sales30d / soldCount de TikTok Shop). Incluye al menos 25% de productos de México (region MX) si existen en la categoría; si en MX no hay datos, dilo en "notas".

Escribe un JSON (lista de objetos) con Write en la ruta que se te indica. Campos EXACTOS por producto:
{
 "nombre_producto": "nombre comercial corto, sin relleno SEO",
 "marca": "",
 "mercado": "US" | "MX",
 "categoria": "<uno de los códigos de categoría de abajo>",
 "subcategoria": "texto corto, p. ej. 'Magnesio complejo', 'Colágeno hidrolizado'",
 "vehiculo": "Cápsula" | "Softgel" | "Tableta" | "Gomita" | "Polvo" | "Líquido/Shot" | "Gotas" | "Té/Infusión" | "Sachet/Stick" | "Efervescente" | "Otro",
 "empaque": "Frasco" | "Tarro" | "Bolsa doypack" | "Caja con sachets" | "Botella" | "Gotero" | "Blíster" | "Otro",
 "presentacion": "p. ej. '60 cápsulas', '300 g / 30 porciones'",
 "ingredientes_clave": ["lista de ingredientes ACTIVOS con dosis si la conoces, p. ej. 'Magnesio glicinato 200 mg'"],
 "formula_base": "fórmula base normalizada en español, ingredientes activos ordenados por importancia, SIN marcas, p. ej. 'Magnesio complejo (glicinato+citrato+malato+...) ' o 'Colágeno hidrolizado + vitamina C + biotina + ácido hialurónico'",
 "para_que_sirve": "beneficio en español, 1 frase",
 "claim_original": "promesa principal del listing en su idioma, corta",
 "precio_usd": número o null (para MX convierte MXN→USD aprox. 1 USD = 18.5 MXN y anota MXN en notas),
 "ventas_30d": número o null,
 "ventas_totales": número o null,
 "gmv_30d_usd": número o null,
 "gmv_total_usd": número o null,
 "rating": número o null,
 "reviews": número o null,
 "tiktok_product_id": "" ,
 "url_imagen": "URL de imagen tal cual vino en el campo image (no inventes URLs)",
 "fuente": "TikTok Shop US vía Ecom Magic" | "TikTok Shop MX vía Ecom Magic" | "WebSearch: <url>",
 "evidencia_viral": "1 frase con el dato duro, p. ej. '108.755 unidades en 30 días, #2 TikTok Shop US Q2 2026 según FastMoss'",
 "semaforo_invima": "Verde" | "Amarillo" | "Rojo",
 "motivo_semaforo": "Verde = ingredientes típicos de suplemento dietario en Colombia (vitaminas, minerales, colágeno, aminoácidos, fibras, probióticos, extractos comunes); Amarillo = algún ingrediente que podría requerir clasificación como fitoterapéutico o tener límites/claims delicados (ashwagandha, saw palmetto, berberina, tongkat ali, shilajit, maca en dosis altas, cafeína alta, hierro, etc.); Rojo = ingrediente que en Colombia es medicamento o prohibido (melatonina, yohimbina, efedra, DHEA, sildenafil/análogos, 5-HTP probablemente) o claim imposible. Explica en 1 frase.",
 "adaptacion_colombia": "cómo lo adaptaríamos para registrarlo en Colombia (p. ej. 'quitar melatonina y usar magnesio+L-teanina+pasiflora')",
 "notas": ""
}

## Códigos de categoría (usa EXACTAMENTE estos)
CAB = Cabello, piel y uñas
COL = Colágeno, rostro y antiedad
BBL = Curvas y glúteos (BBL)
PES = Control de peso y metabolismo (incluye glucosa)
DIG = Digestión, detox e hígado
SXM = Libido y rendimiento masculino
SXF = Salud femenina, libido e íntima (incluye menopausia, hormonal, SOP)
PRO = Próstata y vías urinarias
SUE = Sueño, estrés y ánimo (incluye magnesio)
ENE = Energía, gym y rendimiento
CER = Cerebro y concentración
INM = Inmunidad y multivitamínicos
ART = Articulaciones, huesos y movilidad
COR = Corazón, circulación y visión
NIN = Niños

Al terminar, tu respuesta final debe ser CORTA (máx. 15 líneas): cuántos productos, desglose por categoría y vehículo, y las 5-8 FÓRMULAS BASE más repetidas que viste (las que un solo registro podría amparar para muchas marcas). No pegues el JSON en la respuesta.
