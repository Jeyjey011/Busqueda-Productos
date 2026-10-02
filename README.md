# Búsqueda de productos para registros INVIMA

Investigación de productos de bienestar ingeribles virales en EE. UU. y México, para agruparlos por fórmula y sacar registros sanitarios INVIMA en Colombia que amparen varias marcas (incluida MAGNIFICA).

**Estado: respaldo preliminar (2 de octubre de 2026).** Estos datos NO salen de FastMoss. Se guardan para cruzarlos con FastMoss en la siguiente sesión.

## Contenido

| Ruta | Qué es |
|---|---|
| `datos/tiktok_shop/*.json` | 173 productos (156 únicos) de TikTok Shop US y MX, por grupo de categorías |
| `datos/productos_consolidados.csv` | Los mismos 173 productos en una sola tabla (separador `;`, abre en Excel). La columna `duplicado_de_otro_archivo` marca repetidos |
| `datos/brief_agentes.md` | Instrucciones y definición de campos usadas por los agentes |
| `regulatorio/regulatorio_invima.md` | Informe sobre registros INVIMA: marcas por registro, costos, tiempos, claims, rotulado |
| `regulatorio/ingredientes_estatus_colombia.json` | 30 ingredientes con su estatus en Colombia |

## De dónde salen los datos y qué tan confiables son

- **Ventas, GMV, precio, reseñas e imagen:** TikTok Shop, consultado el 2 de octubre de 2026 con la herramienta "spy TikTok Shop" de Ecom Magic. Son datos reales de esa fuente, pero **no son FastMoss** y no se han cruzado con FastMoss.
- **Precios de México:** en algunos listings la herramienta mezcla USD y MXN; cada caso está explicado en el campo `notas`.
- **Ingredientes y dosis:** varios **no se confirmaron contra la etiqueta**, porque se agotó el cupo de búsquedas web. Cada caso está indicado en `notas`.
- **Regulatorio INVIMA:** sale de extractos de búsqueda web; no se pudieron leer los textos completos de las normas porque la red los bloqueó. Cada dato está marcado como `[CONFIRMADO]`, `[INFERENCIA]` o `[POR CONFIRMAR]`. **Hay que validarlo con un asesor regulatorio antes de radicar.**
- **Semáforo INVIMA por producto** (Verde/Amarillo/Rojo): es una clasificación preliminar de los agentes, no un concepto regulatorio.
- **Categorías incompletas:** inmunidad, articulaciones, corazón y niños (INM/ART/COR/NIN) se pararon antes de terminar y tienen pocos productos.

## Siguiente paso

1. Sacar los rankings de bienestar o salud de FastMoss (EE. UU. y México): en una sesión local con el navegador o exportándolos a Excel.
2. Cruzarlos con estos datos.
3. Agrupar por familia de registro, es decir, fórmula base + vehículo. Un registro de suplemento dietario ampara hasta 3 marcas (Decreto 3863 de 2008, por confirmar).
4. Armar el Excel final.
