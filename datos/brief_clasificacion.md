# Brief para agentes clasificadores (FastMoss, octubre 2026)

Contexto: un emprendedor colombiano (marca propia MAGNIFICA y otras) va a sacar registros sanitarios INVIMA para productos de bienestar INGERIBLES y venderlos por dropshipping (Dropi) en Colombia. Un registro sanitario de suplemento dietario ampara una FÓRMULA (composición + forma farmacéutica o vehículo); varias marcas pueden ir sobre el mismo registro si la composición es idéntica. Por eso cada producto debe quedar con una fórmula base normalizada y un vehículo.

## Fuentes que puedes usar
1. Tu lote: `datos/fastmoss/lote_N.json` (product_id, título, tienda, región, rankings en los que aparece). Los datos de ventas NO los copies: el Excel los toma directo de los archivos crudos.
2. Respaldo previo con ingredientes ya investigados: `datos/productos_consolidados.csv` (separador `;`, UTF-8). Si el `tiktok_product_id` coincide, o es el mismo producto de la misma marca, reutiliza sus ingredientes, fórmula, semáforo y adaptación (revisa que tengan sentido).
3. Estatus regulatorio de ingredientes en Colombia: `regulatorio/ingredientes_estatus_colombia.json`. Úsalo para el semáforo.
4. WebSearch: máximo 12 búsquedas por agente, solo para los productos de más ventas de tu lote cuyo título no deja clara la fórmula. WebFetch y curl pueden estar bloqueados. No uses herramientas de FastMoss (cuestan créditos).

## Códigos de categoría (usa EXACTAMENTE estos)
CAB Cabello, piel y uñas | COL Colágeno, rostro y antiedad | BBL Curvas y glúteos | PES Control de peso y metabolismo (incluye glucosa) | DIG Digestión, detox e hígado (incluye probióticos y fibra) | SXM Libido y rendimiento masculino | SXF Salud femenina, libido e íntima (menopausia, hormonal, SOP, pH vaginal) | PRO Próstata y vías urinarias | SUE Sueño, estrés y ánimo (incluye magnesio y cortisol) | ENE Energía, gym y rendimiento (incluye creatina, proteína, electrolitos) | CER Cerebro y concentración | INM Inmunidad y multivitamínicos | ART Articulaciones, huesos y movilidad | COR Corazón, circulación y visión | NIN Niños | EXC No ingerible o fuera de alcance (tópicos, aceites de masaje, dispositivos, alimentos comunes)

## Vehículos (usa EXACTAMENTE estos)
Cápsula | Softgel | Tableta | Gomita | Polvo | Líquido/Shot | Gotas | Té/Infusión | Sachet/Stick | Efervescente | Otro

## Semáforo INVIMA (preliminar, no es concepto regulatorio)
- Verde: ingredientes típicos de suplemento dietario (vitaminas, minerales, colágeno, aminoácidos, creatina, fibras, probióticos, enzimas, extractos comunes).
- Amarillo: algún ingrediente "Por confirmar", "Permitido con límite" o "Fitoterapéutico/Vademécum" en el JSON, o con claims delicados (saw palmetto, berberina, tongkat ali, shilajit, 5-HTP, fenogreco, NAD+, cúrcuma, cafeína alta, hierro, mezclas de 9+ plantas, etc.).
- Rojo: algún ingrediente "Prohibido" o "Medicamento" en el JSON: melatonina, yohimbina, efedra, DHEA, sildenafil o análogos, ASHWAGANDHA, GARCINIA CAMBOGIA, TRIBULUS, kratom, sibutramina; o claim imposible.
REGLA: el JSON de ingredientes manda sobre cualquier ejemplo. La ashwagandha es Rojo (listado INVIMA de plantas tóxicas, marzo 2025), aunque el respaldo Ecom Magic la tenga en Amarillo. Si un ingrediente no está en el JSON, razónalo y dilo en `motivo_semaforo`.

## Salida
Escribe con Write `datos/fastmoss/clasificado_lote_N.json`: lista JSON UTF-8 indentada, UN objeto por cada producto del lote (mismo orden, no omitas ninguno), con EXACTAMENTE estos campos:
{
 "product_id": "texto exacto del lote",
 "nombre_corto": "nombre comercial corto en el idioma original, sin relleno SEO (máx. 60 caracteres)",
 "marca": "",
 "es_ingerible": true | false,
 "categoria": "código",
 "subcategoria": "texto corto en español, p. ej. 'Magnesio complejo', 'Probiótico + enzimas'",
 "vehiculo": "uno de la lista",
 "presentacion": "p. ej. '60 cápsulas', '300 g / 30 porciones', o '' si no se sabe",
 "ingredientes_clave": ["activos con dosis si se conoce, p. ej. 'Magnesio glicinato 200 mg'"],
 "formula_base": "fórmula normalizada en español, activos ordenados por importancia, SIN marcas ni dosis, p. ej. 'Magnesio complejo (8 formas)' o 'Probióticos + enzimas digestivas + jengibre'",
 "para_que_sirve": "1 frase en español",
 "semaforo_invima": "Verde" | "Amarillo" | "Rojo" | "N/A" (N/A solo si es_ingerible es false),
 "motivo_semaforo": "1 frase",
 "adaptacion_colombia": "cómo adaptarlo para registrarlo como suplemento dietario en Colombia (quitar o cambiar qué), 1 frase",
 "fuente_ingredientes": "Título FastMoss" | "Respaldo Ecom Magic" | "WebSearch: <url>" | "Inferido",
 "confianza_formula": "Alta" | "Media" | "Baja",
 "notas": "dudas, p. ej. 'kit de 2 frascos', 'mismo producto que <product_id>'; '' si no hay"
}
Todo en español salvo `nombre_corto` y `marca`. No inventes dosis: si no las sabes, pon el ingrediente sin dosis y baja la confianza.
Al final valida con node que el archivo es JSON válido y tiene el mismo número de objetos que el lote.

Respuesta final CORTA (máx. 10 líneas): cuántos productos, desglose por categoría y semáforo, cuántos con confianza Baja, y las 5 fórmulas base más repetidas en tu lote.
