# Auditoría del Excel `salida/Plan_registros_INVIMA_FastMoss_oct2026.xlsx`

Fecha: 2 de octubre de 2026 · Auditor: Claude (solo lectura; no se modificó el Excel, el script ni los JSON)
Scripts usados: `scripts/auditoria_lib.js` y `scripts/auditoria_00…14_*.js`. Los hipervínculos se probaron en Excel 16 (COM) sobre una copia del archivo.

## Veredicto

**Listo con correcciones menores.**

Los datos están limpios: no hay ninguna diferencia entre el Excel y los JSON crudos, que se compararon fila por fila (560 filas). Los totales por familia cuadran y no hay ingredientes prohibidos en Verde o Amarillo ni en las fórmulas propuestas. Los problemas son de coherencia del semáforo y de redacción de algunas declaraciones. Se corrigen editando campos de texto en los JSON y volviendo a ejecutar `node scripts/construir_excel.js`. **Antes de enviar hay que corregir las 2 Altas**; también conviene corregir las Medias, que son las que más se notan si Guillermo filtra por semáforo.

Resumen: **2 Altas · 9 Medias · 13 Bajas**.

## Hallazgos

Notas de lectura:
- Las filas del Excel son las de la hoja. En el Catálogo, el código Pnnn está en la fila 5 + nnn.
- En el Plan, las filas son: F01=6, F02=7, F03=8, F04=9, F06=10, F05=11, F07=12, F08=13, F09=14, F10=15, F18=16, F11=17, F12=18, F16=19, F13=20, F14=21, F19=22, F17=23, F22=24, F15=25, F20=26, F21=27, F23=28, F25=29, F29=30, F24=31, F26=32, F28=33, F27=34.

### Alta

| # | Hoja / fila / código | Qué está mal | Evidencia | Corrección sugerida (archivo y campo) |
|---|---|---|---|---|
| A1 | Plan de registros, fila 31 (F24) | La declaración sugerida tiene connotación hormonal y sexual, justo en la familia de mayor riesgo, y contradice la propia columna "Ingredientes a evitar" de esa fila. | Declaraciones: "El zinc contribuye al mantenimiento de niveles normales de testosterona en sangre". Evitar: "Cualquier mención de testosterona alta, potencia, libido…". INVIMA vigila esta categoría (URODOC 277-2026, sildenafilo oculto). | `datos/plan_registros.json` → `familias[F24].declaraciones_sugeridas`: quitar la frase de testosterona y dejar, por ejemplo, "El zinc contribuye al metabolismo normal de los macronutrientes; La vitamina B12 contribuye a disminuir el cansancio y la fatiga". |
| A2 | Catálogo clasificado, P172 (fila 177), P213 (218), P218 (223) y P007 (12) frente a P079 (84) y P088 (93) | Hay creatinas de 5 g por porción en **Verde**, y en P172 el propio motivo dice que la dosis excede el tope. Además, el mismo producto (YESNAP PeachPout) sale en Verde en un listing y en Amarillo en otros dos. | P172: semáforo "Verde", motivo "…tope de 3 g/día; la porción de 5 g lo supera". P007 = Verde; P079 y P088 = Amarillo ("aquí 5 g"). Las tres son el mismo título. | `datos/fastmoss/clasificado_lote_1.json` (1732376373883998234), `clasificado_lote_3.json` (1734908639111316696) y `clasificado_lote_4.json` (1731792010987210968, 1734303279583364312) → `semaforo_invima` = "Amarillo". Ajustar `motivo_semaforo` en P213 y P218 ("5 g por porción supera el tope de 3 g/día"). |

### Media

| # | Hoja / fila / código | Qué está mal | Evidencia | Corrección sugerida (archivo y campo) |
|---|---|---|---|---|
| M1 | Catálogo; se arrastra a las hojas Top y Tendencia | El mismo producto tiene semáforos distintos según el listing. | LeeFar/IOHO Her Juicy: P010, P013, P158 y P191 en Verde; P072, P087, P134 y P138 en Amarillo, con el mismo motivo (olmo resbaladizo no confirmado). Toyocare bebida relajante (maca + D3 + Mg + L-teanina): P215 en Verde; P140, P142, P149 y P179 en Amarillo. Neuro con cafeína: P115 (mentas) en Verde y categoría ENE; P063 (chicle) en Amarillo y categoría CER. | `clasificado_lote_1.json` (1729890372836496007, 1729698659696480903), `clasificado_lote_3.json` (1735722147718857972, 1735722965679375604) y `clasificado_lote_4.json` (1734151946164930270, 1732495425519259779) → `semaforo_invima` = "Amarillo". En P115 (1732495425519259779) unificar `categoria` con P063. |
| M2 | Fuentes y método, fila 17; Ingredientes Colombia | La leyenda del semáforo no coincide con cómo se aplicó. | La leyenda dice que Amarillo es "algún ingrediente con límite", y la hoja Ingredientes pinta de Amarillo la creatina, la biotina, las vitaminas A/D/E/K y la cafeína. Sin embargo, hay 16 productos Verde con creatina, 15 con biotina, 12 con vitamina D/K y 1 con cafeína. Las familias F04, F05, F06, F08, F15, F18, F19, F21, F23 y F28 también están en Verde. | `scripts/construir_excel.js`, función `fuentesHoja`, bloque "Clasificación, fórmulas y semáforo": redefinir "Verde = ingredientes de suplemento dietario, incluidos los que tienen límite si la dosis lo respeta". Las alternativas son recolorear o aplicar el criterio de A2. |
| M3 | Plan de registros, filas 31 (F24), 15 (F10), 20 (F13) y 29 (F25) | No se explica que el semáforo de la familia se refiere a la fórmula propuesta, no a los productos virales. En F24 el resultado confunde. | F24, "Vitalidad masculina, libido, próstata y curvas (reformular o descartar)", está en **Verde** aunque sus 17 productos son 11 Amarillo y 6 Rojo. F10, F13 y F25 están en Verde con el 100 % de sus productos en Amarillo. | `plan_registros.json` → `familias[F24].semaforo` = "Amarillo" (o renombrar `nombre` a "Vitalidad masculina con maca y zinc (reformulada)"). En `construir_excel.js`, en el subtítulo de la hoja Plan, añadir "El semáforo de la familia califica la fórmula propuesta para Colombia". |
| M4 | Plan de registros, filas 21 (F14) y 20 (F13) | Hay declaraciones que contradicen la columna "evitar" de la misma fila. | F14: la declaración "La vitamina B6 contribuye a regular la actividad hormonal" choca con "No decir… 'equilibrio hormonal'" (y la familia viene de kits de cortisol/SOP). F13: la declaración "El cromo contribuye al mantenimiento de niveles normales de glucosa en sangre" choca con "Nada… de indicaciones sobre el azúcar en sangre". | `plan_registros.json` → `familias[F14].declaraciones_sugeridas`: cambiar la frase de B6 por "La vitamina B6 contribuye a disminuir el cansancio y la fatiga". `familias[F13]`: o se quita la declaración del cromo, o se reescribe `ingredientes_a_evitar` como "no decir 'controla la diabetes' ni 'baja el azúcar'". |
| M5 | Catálogo, P104 (fila 109), P105 (110) y P108 (113); Resumen, filas 33 y 36 | Tres snacks de categoría EXC (corvina, higo con nuez, kumquat) tienen semáforo **Verde** y no "N/A". | Por eso el Resumen dice Verde = 110 y N/A = 3, cuando EXC son 6 productos (debería decir 107 y 6). | `clasificado_lote_4.json` (1732504769622610930, 1732494729808286706, 1732614288251719922) → `semaforo_invima` = "N/A". |
| M6 | Plan (subtítulo, fila 2) y Fuentes, fila 18 | Se afirma que "cada fila es UNA fórmula base + vehículo", pero 10 familias suman productos de otros vehículos, y eso infla "N.º productos" y las unidades. | F09: 8 gotas + 4 sticks + 2 cápsulas. F11: tableta, cápsula, gomita, softgel y polvo. F14, F15, F19, F20 (3 chicles/mentas), F24, F25 y F29 también mezclan vehículos. Solo F09 y F19 lo aclaran en su justificación. | `construir_excel.js` (subtítulo del Plan y `fuentesHoja`): aclarar "la demanda incluye productos de otros vehículos asignados por cercanía". Opcional: en `plan_registros.json` → `justificacion` de F11, F14, F15, F20, F24 y F25, decir cuántos productos son del mismo vehículo. |
| M7 | Catálogo, P153 (fila 158) frente a P222 (227) y P230 (235) | El mismo combo WindBoss (Cortisol + Myo-Inositol) tiene vehículo y categoría distintos según el listing, y eso implica registros distintos. | P153: SUE, Cápsula. P222 y P230: SXF, Softgel. Los títulos son idénticos. | `clasificado_lote_3.json` (1734892603444921471) o `clasificado_lote_4.json` (1731794003849414783, 1734678914932180800) → unificar `vehiculo` y `categoria`. |
| M8 | Plan de registros, filas 10 (F06) y 9 (F04) | Las justificaciones citan un puesto que no coincide con el ranking que ve el cliente (la hoja Top EE. UU. está ordenada por unidades). | F06 dice "NeoCell… producto n.º 2 del listado", pero NeoCell es el puesto 5 (es el n.º 2 solo por GMV). F04 dice "YESNAP PeachPout… n.º 4", pero es el puesto 7 (el n.º 4 solo por GMV). | `plan_registros.json` → `familias[F06].justificacion` y `familias[F04].justificacion`: "n.º 2 por GMV (puesto 5 por unidades)" y "n.º 4 por GMV (puesto 7 por unidades)". |
| M9 | Catálogo (Motivo del semáforo, Notas, Fuente de ingredientes) y Anexo (Notas) | Hay jerga interna en celdas que lee el cliente. | "JSON" aparece en 77 celdas de Motivo y en 3 de Notas ("no está en el JSON regulatorio"). Hay IDs de TikTok de 19 dígitos en 86 Notas, en lugar de los códigos Pnnn. "WebSearch: https://…" aparece en 40 celdas de Fuente. "respaldo" sale en 37 Notas, "salePrice" en 16 Notas del Anexo y "slug" y "lote" en 1 cada uno. | `clasificado_lote_*.json` → `motivo_semaforo` y `notas`: cambiar "el JSON (regulatorio)" por "la hoja Ingredientes Colombia" y "respaldo" por "Anexo Ecom Magic". En `fuente_ingredientes`, cambiar "WebSearch:" por "Búsqueda web:". Los IDs se pueden sustituir por los códigos Pnnn en `construir_excel.js` (columna Notas) con un reemplazo `id → porId.get(id).codigo`. |

### Baja

| # | Hoja / fila / código | Qué está mal | Evidencia | Corrección sugerida (archivo y campo) |
|---|---|---|---|---|
| B1 | Plan, filas 25 (F15) y 15 (F10) | Hay declaraciones cardiovasculares o de glucosa con riesgo de objeción. Ya llevan "verificar". | F15: "El EPA y el DHA contribuyen al funcionamiento normal del corazón". F10: la declaración de cromo y glucosa en una familia de control de peso (la Guía la admite "si está en la lista"). | `plan_registros.json` → `declaraciones_sugeridas`: dejarlas como opcionales o pasarlas a "Riesgos y pendientes". |
| B2 | Plan, columna A (imagen) de las filas 7 (F02), 21 (F14) y 22 (F19) | La imagen de referencia de una familia Verde es un producto **Rojo**. | F02 muestra P040 (Lemme, con ashwagandha), F14 muestra P133 (WindBoss con ashwagandha) y F19 muestra P062 (Rainbow Light con ashwagandha). | `construir_excel.js`, en `tabla(wsP…, imagenes:)`: usar el primer producto de `f._top` que no sea Rojo. |
| B3 | Catálogo: P014 (19), P070 (75), P130 (135), P064 (69), P058/P166 frente a P114/P137, y P021/P144 frente a P151/P180 | Hay clasificaciones discutibles o inconsistentes entre productos equivalentes. | P014 (Nitric Oxide, sin ángulo sexual) está en SXM. P070 (astaxantina) está en F15 (D3 + K2 + omega 3) y encaja mejor en F25. P130 (cayena "gut health") está en F11 (remolacha). P064 (pastilla para chupar) está en F03 (cápsula). El aceite de orégano + semilla negra aparece en INM y en DIG, y la D3 + K2 en INM y en ART. | `clasificado_lote_*.json` → `categoria`. `plan_registros.json` → `asignacion` de 1729409703327011501 (P070) y 1729516477415528153 (P130). |
| B4 | Catálogo, P098 (103) y P220 (225) | Hay kits que incluyen un spray íntimo tópico y cuentan como demanda de F02. | Presentación: "gomitas + spray íntimo Her Fresh". El spray es cosmético. | `plan_registros.json` → `familias[F02].riesgos`: mencionar que el spray no entra en el registro de suplemento dietario. |
| B5 | Plan, fila 27 (F21); Catálogo; Top EE. UU.; Lanzamientos | Hay celdas vacías. | F21 tiene vacío "Ingredientes a evitar". P106 no tiene Marca. 31 productos no tienen Presentación. La columna "Familia de registro" está vacía en los EXC (P045, P101, P103, P104, P105, P108). | `plan_registros.json` → `familias[F21].ingredientes_a_evitar` = "Ninguno". `clasificado_lote_4.json` (1732516846911787527) → `marca` = "Sin marca visible". Completar `presentacion` en los `clasificado_lote_*.json`. En `construir_excel.js` → `familiaTexto`, devolver "No aplica (fuera de alcance)" para EXC. |
| B6 | Catálogo, columna Precio; subtítulos del Plan y del Catálogo; Fuentes, fila 12 | Los números están en formato inglés dentro de un texto en español, y los decimales no son uniformes. | "US$16 – 45.9", "US$12.5", "MX$235.6"; "18.5 MXN/USD". En el resto del libro se usa coma decimal ("1,4 mg"). | `construir_excel.js` → `precioTexto` (usar `toLocaleString('es-CO', {minimumFractionDigits: 2})`) y las cadenas que muestran `TASA_MXN` ("18,5"). |
| B7 | Resumen, fila 58 | La moneda es ambigua en un libro que usa US$ y MX$. | "(≈ $0,65 M en 2026; $0 para microempresa)" | `construir_excel.js`, función `resumenHoja`, regla 2: escribir "≈ COP 0,65 millones". |
| B8 | Resumen, fila 8; Plan, fila 7 (F02) | La fila "Productos analizados (únicos)" en realidad cuenta listings, no productos distintos. | Her Juicy tiene 8 listings, Toyocare relajante 5, YESNAP drenaje 4 y PeachPout 3. En F02, "Productos de referencia" repite el mismo producto (P010 y P013). Fuentes lo aclara, pero el Resumen dice "únicos". | `construir_excel.js` → `kpis`: "Listings analizados (únicos por ID de TikTok)". En `_refs`, deduplicar por `nombre_corto`. |
| B9 | Resumen, filas 64 a 73 | Los hipervínculos internos funcionan en Excel de escritorio, pero el XML es atípico. | Probado con Excel 16: los 10 vínculos abren la hoja correcta. Sin embargo, el XML guarda `location="#'Hoja'!A1"` (con "#") y además una relación externa, y puede fallar en Google Sheets, LibreOffice o Excel web. | `construir_excel.js` → `resumenHoja`: usar una fórmula `HYPERLINK("#'Hoja'!A1";"Hoja")` o probarlo en el visor que vaya a usar Guillermo. |
| B10 | Ingredientes Colombia; Plan, fila 30 (F29) | El plan declara NAC "medicamento" y kava "prohibida", pero ninguno de los dos está en la base regulatoria. | No aparecen en `ingredientes_estatus_colombia.json` ni en `regulatorio_invima.md`. | `regulatorio/ingredientes_estatus_colombia.json`: añadir las entradas NAC y kava con su fuente (o marcarlas "Por confirmar"). |
| B11 | Plan, fila 30 (F29) | El tipo de registro no corresponde a una familia que se recomienda descartar. | `tipo_registro` = "Fitoterapéutico (PFT)", mientras que la fórmula propuesta dice "No se propone un registro propio". | `plan_registros.json` → `familias[F29].tipo_registro` = "No aplica (descartar)". |
| B12 | Catálogo (Notas, Presentación) y Anexo | Hay anglicismos en textos en español. | "bundle", "pack", "listing", "Variety pack", "slug". Los nombres comerciales en inglés de la columna Producto son aceptables. | `clasificado_lote_*.json` → `notas` y `presentacion`: "kit", "paquete", "publicación". |
| B13 | Plan, fila 13 (F08) | F08 tiene prioridad 1 aunque su demanda es la n.º 22 de 29 (US$ 0,70 M), por debajo de F09, F10, F18, F11 y F12. | La justificación ("fuerte en México") es razonable, pero un lector lo puede ver como incoherente. | `plan_registros.json` → `familias[F08].justificacion`: explicitar por qué va antes que F11 y F12 (vehículo sencillo, Verde, México). |

## Qué se verificó y salió bien

**Integridad de filas**
- La hoja Top EE. UU. tiene 100 filas, Top México 100, Tendencia semana 39 tiene 100 (50 de EE. UU. + 50 de México, con puestos del 1 al 50 sin huecos) y Lanzamientos nuevos tiene 30.
- No hay IDs repetidos dentro de ningún ranking y el orden por unidades es correcto.
- El Catálogo tiene 230 filas, con 230 códigos únicos (P001–P230) y 230 IDs de TikTok únicos. Coincide con los 230 IDs de los 4 JSON crudos.
- Los 230 productos están clasificados, sin duplicados entre lotes.
- El plan asigna 224 productos. Los 6 sin familia son exactamente los EXC. No hay asignaciones a familias inexistentes ni familias vacías.

**Valores frente a los JSON crudos**
- Se compararon el **100 %** de las filas, no solo una muestra de 30:
  - en las 330 filas de ranking: puesto, título, tienda, precio mínimo y máximo, unidades, GMV, crecimiento, unidades y GMV históricos, comisión, URL, semáforo y vehículo;
  - en las 230 filas del Catálogo: unidades y GMV de septiembre, GMV en USD (MXN / 18,5), crecimiento, unidades de la semana 39, semáforo, vehículo, subcategoría y familia.
- **Resultado: 0 diferencias.**

**Moneda**
- Todas las filas de México usan el formato MX$ y todas las de EE. UU. usan US$, tanto en precio como en GMV y GMV histórico, en las hojas de ranking y en el Catálogo. Lanzamientos está todo en USD.

**Sumas del Plan**
- Para las 29 familias cuadran N.º de productos, unidades de EE. UU., unidades de México y GMV en USD con el Catálogo. La suma de productos da 224.
- Las cifras que cita cada justificación (unidades, productos y US$ M) coinciden con las calculadas en las 29 familias.

**Resumen**
- Los indicadores son consistentes: 230 productos (130 de EE. UU. y 100 de México), 224 ingeribles, 29 familias, 8 de prioridad 1, 1.401.495 unidades en EE. UU. y 346.589 en México.
- La tabla de los 12 primeros registros sigue el orden del Plan.

**Ingredientes prohibidos**
- Ningún producto con ashwagandha, garcinia, tribulus, melatonina, DHEA, yohimbe, efedra, kava, sildenafilo/tadalafilo, NAC, sibutramina o kratom (en la fórmula, en los ingredientes o en el título) quedó en Verde o Amarillo.
- El único resultado de la búsqueda fue "LullaBites… (Melatonin Free)", que es un falso positivo.
- Ningún producto Verde contiene ingredientes "Por confirmar" (berberina, 5-HTP, shilajit, tongkat, saw palmetto, NMN/NAD+, glutatión, musgo marino, fenogreco, aguaje) ni cúrcuma.

**Fórmulas propuestas y declaraciones**
- Ninguna de las 29 fórmulas propuestas para Colombia contiene un ingrediente Rojo.
- Ninguna declaración sugerida contiene "bajar de peso", "quemar grasa", "próstata", "libido", "potencia", "glúteos", "curar", "prevenir", "desinflamar", "detox" ni "pH vaginal". Las excepciones a revisar son A1, M4 y B1.

**Coherencia de los semáforos de familia**
- F09 y F27 están en Amarillo porque sus plantas o aceites no están confirmados, y F29 en Rojo porque se descarta. Las demás reformulan a ingredientes de suplemento dietario (salvo F24, ver M3).

**Prioridad 1 y demanda**
- 5 de las 8 familias de prioridad 1 están entre las 8 de mayor GMV.
- Las de mayor demanda que no son prioridad 1 (F09, F25, F10) tienen un gancho prohibido o ingredientes por confirmar, así que la decisión es coherente.

**Productos no ingeribles y vehículos**
- Los no ingeribles (óvulos de ácido bórico, esencia de masaje, mineral de uso externo) están en EXC con semáforo N/A.
- No hay "gummies" en cápsula ni cápsulas en gomita. Las discrepancias de vehículo frente al título son benignas: aceites "en cápsulas" que son softgels y kits.

**Enlaces e imágenes**
- Las 570 URL de FastMoss tienen formato válido `https://www.fastmoss.com/e-commerce/detail/<ID>` y el ID coincide con el `product_id` en todos los casos.
- Las imágenes cargaron completas: 230 en el Catálogo, 100 en cada ranking, 30 en Lanzamientos y 29 en el Plan.

**Ortografía**
- No se encontraron tildes faltantes sistemáticas. Las únicas formas sin tilde ("capsulas", "vademecum", "colageno") están dentro de URLs de fuentes.
- La Guía INVIMA no tiene restos de Markdown, y ninguna fila del Plan ni del Catálogo llega al alto máximo, así que no hay texto cortado por altura.
