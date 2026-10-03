# Brief: fotos de producto por marca única (APIMart)

Directorio: C:\Users\PERSONAL\Documents\BUSQUEDA PRODUCTOS\repo
Carga las herramientas con ToolSearch: "select:mcp__apimart__generate_image,mcp__apimart__get_task".

Las indicaciones están en `datos/empaques/prompts_unicas.json` (cada objeto: registro, n, nombre, prompt). Para cada objeto de los registros que te asignen (las 3 marcas de cada registro, n = 1, 2 y 3):
1. Si ya existe `salida/empaques_unicas/<registro>_<n>.jpg`, sáltalo.
2. Llama a mcp__apimart__generate_image con model = "gemini-3.1-flash-image-preview", idempotency_key = "unica-<registro>-<n>-v1", input = { "prompt": <prompt EXACTO>, "size": "9:16", "resolution": "1K", "n": 1 }. Lanza varias seguidas (por ejemplo 6) antes de consultar.
3. Consulta mcp__apimart__get_task con el task_id EXACTO hasta que "terminal" sea true. Si falla, reintenta UNA vez con idempotency_key "unica-<registro>-<n>-v2".
4. Descarga con Bash: cd "/c/Users/PERSONAL/Documents/BUSQUEDA PRODUCTOS/repo/scripts" && node descargar_unica.js <registro> <n> "<url de result.images[0].url[0]>"  (debe imprimir "ok").
5. Al final revisa que existan los 3 archivos de cada registro asignado; si falta alguno, recupéralo (get_task de la tarea ya hecha o una nueva generación).
No generes imágenes de registros que no te asignaron (cuestan dinero). No cambies modelo ni parámetros. No escribas archivos fuera de salida/empaques_unicas.
Respuesta final de máximo 3 líneas: cuántas generaste, cuáles fallaron y el costo total.
