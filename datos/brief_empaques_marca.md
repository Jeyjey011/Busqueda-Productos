# Brief: fotos de producto por marca madre (APIMart)

Directorio: C:\Users\PERSONAL\Documents\BUSQUEDA PRODUCTOS\repo
Carga las herramientas con ToolSearch: "select:mcp__apimart__generate_image,mcp__apimart__get_task".

Las indicaciones están en `datos/empaques/prompts_marcas.json` (cada objeto: registro, marca, nombre, prompt). Para cada objeto de los registros que te asignen (las 3 marcas de cada registro):
1. Si ya existe `salida/empaques_marca/<registro>_<marca>.jpg`, sáltalo.
2. Llama a mcp__apimart__generate_image con model = "gemini-3.1-flash-image-preview", idempotency_key = "marca-<registro>-<marca>-v1", input = { "prompt": <prompt EXACTO>, "size": "9:16", "resolution": "1K", "n": 1 }. Lanza varias seguidas (por ejemplo 6) antes de consultar.
3. Consulta mcp__apimart__get_task con el task_id EXACTO hasta que "terminal" sea true. Si falla, reintenta UNA vez con idempotency_key "marca-<registro>-<marca>-v2".
4. Descarga con Bash: cd "/c/Users/PERSONAL/Documents/BUSQUEDA PRODUCTOS/repo/scripts" && node descargar_marca.js <registro> <marca> "<url de result.images[0].url[0]>"  (debe imprimir "ok").
No generes imágenes de registros que no te asignaron (cuestan dinero). No cambies modelo ni parámetros.
Respuesta final de máximo 3 líneas: cuántas generaste, cuáles fallaron y el costo total.
