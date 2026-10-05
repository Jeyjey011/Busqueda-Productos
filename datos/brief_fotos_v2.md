# Brief: fotos premium por marca (APIMart, Nano Banana Pro)

Directorio: C:\Users\PERSONAL\Documents\BUSQUEDA PRODUCTOS\repo
Carga las herramientas con ToolSearch: "select:mcp__apimart__generate_image,mcp__apimart__get_task".

Las indicaciones están en `datos/empaques/prompts_v2.json` (cada objeto: registro, nombre, logo, pack, life). Cada registro asignado necesita 3 imágenes EN CADENA:

1. **logo**: generate_image con model = "gemini-3-pro-image-preview", idempotency_key = "v2-<registro>-logo-v1", input = { "prompt": <logo EXACTO>, "size": "1:1", "resolution": "2K", "n": 1 }.
2. Cuando el logo termine (get_task con el task_id EXACTO hasta "terminal": true), toma su URL (result.images[0].url[0]) y:
   - descárgalo: `cd "/c/Users/PERSONAL/Documents/BUSQUEDA PRODUCTOS/repo/scripts" && node descargar_v2.js <registro> logo "<url>"` (debe imprimir "ok");
   - genera el **pack**: key "v2-<registro>-pack-v1", input = { "prompt": <pack EXACTO>, "size": "4:5", "resolution": "2K", "n": 1, "image_urls": ["<url del logo>"] }.
3. Cuando el pack termine: descárgalo (`node descargar_v2.js <registro> pack "<url>"`) y genera el **life**: key "v2-<registro>-life-v1", input = { "prompt": <life EXACTO>, "size": "9:16", "resolution": "2K", "n": 1, "image_urls": ["<url del pack>"] }. Cuando termine, descárgalo (`node descargar_v2.js <registro> life "<url>"`).

Trabaja en paralelo: arranca los logos de TODOS tus registros de una vez y ve avanzando cada cadena apenas termine el paso anterior. Cada imagen tarda de 30 a 150 segundos.
Si una generación falla, reintenta UNA vez con la misma key terminada en "-v2". Si existe ya `salida/marcas_v2/<registro>_<tipo>.jpg`, ese paso está hecho (pero para encadenar necesitas la URL: si te falta, regenera ese paso).
No generes imágenes de registros que no te asignaron. No cambies modelo ni parámetros. No escribas archivos fuera de salida/marcas_v2.
Al final verifica que existan los 3 archivos de cada registro asignado. Respuesta final de máximo 3 líneas: cuántas imágenes generaste, cuáles fallaron y el costo.
