# Búsqueda de productos para registros INVIMA

Investigación de suplementos ingeribles virales en TikTok Shop de EE. UU. y México, para agruparlos por fórmula y sacar registros sanitarios INVIMA en Colombia que amparen varias marcas (incluida MAGNIFICA).

**Estado (2 de octubre de 2026):** datos de FastMoss extraídos, productos clasificados, plan de registros armado y Excel final generado.

## Entregables

**Para Guillermo (versión simple):** `salida/Productos_a_registrar_Guillermo.xlsx`. La hoja "Registros a sacar" lista los registros agrupados por categoría (cuáles van ya y cuáles después), y hay una pestaña por categoría con los productos virales agrupados por presentación, su tendencia (subiendo, estable, bajando o quemado) y si entran en algún registro. Se regenera con `node scripts/construir_excel_simple.js`, después de `construir_excel.js`, que deja las imágenes en caché.

**Detalle técnico (para el asesor regulatorio):** 
`salida/Plan_registros_INVIMA_FastMoss_oct2026.xlsx`. Tiene estas hojas:
- Resumen
- Plan de registros
- Catálogo clasificado (con imágenes)
- Top EE. UU. sep-2026
- Top México sep-2026
- Tendencia semana 39
- Lanzamientos nuevos EE. UU.
- Ingredientes Colombia
- Guía INVIMA
- Anexo Ecom Magic
- Fuentes y método

Para regenerarlo:

```bash
cd scripts && npm install && cd .. && node scripts/construir_excel.js
```

## Contenido

| Ruta | Qué es |
|---|---|
| `datos/fastmoss/us_mensual_2026-09.json`, `mx_mensual_2026-09.json` | Top 100 de Food Supplements (id 700646) de septiembre de 2026, EE. UU. y México, según FastMoss |
| `datos/fastmoss/semanal_2026-W39.json` | Top 50 por país de la semana 39 (21–27 sep) |
| `datos/fastmoss/nuevos_us_2026-09.json` | Top 30 de productos nuevos (menos de 30 días) en EE. UU. |
| `datos/fastmoss/clasificado_lote_*.json` | Clasificación de los 230 productos únicos: categoría, vehículo, fórmula base, ingredientes, semáforo INVIMA y adaptación |
| `datos/plan_registros.json` | 29 familias de registro (fórmula + vehículo) con prioridad, fórmula propuesta para Colombia y claims sugeridos |
| `datos/brief_clasificacion.md`, `datos/brief_plan_registros.md` | Instrucciones que siguieron los agentes |
| `datos/auditoria_excel.md` | Auditoría del Excel final |
| `datos/productos_consolidados.csv`, `datos/tiktok_shop/*.json` | Investigación previa con Ecom Magic (anexo) |
| `regulatorio/regulatorio_invima.md`, `regulatorio/ingredientes_estatus_colombia.json` | Informe regulatorio y estatus de 30 ingredientes |
| `scripts/` | `unir_fastmoss.js` (une rankings y arma lotes), `resumen_para_plan.js`, `construir_excel.js` |

## Confiabilidad

- **Ventas, GMV, precios e imágenes:** API de FastMoss (MCP oficial), consultada el 2 de octubre de 2026. Los números se copian tal cual.
- **Clasificación, fórmulas y semáforo:** hechos por agentes de IA a partir del título, la investigación previa y búsquedas web puntuales. Cada producto indica la confianza y la fuente de sus ingredientes.
- **Regulatorio:** sale de extractos de búsqueda web (no se pudieron leer las normas completas). Hay que **validarlo con un asesor regulatorio antes de radicar**.
- **Criterio de semáforo:** manda `ingredientes_estatus_colombia.json`. Ashwagandha, garcinia y tribulus están en Rojo porque figuran en el listado INVIMA de plantas tóxicas de marzo de 2025.
