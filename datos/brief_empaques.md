# Brief: generar fotos de empaque con APIMart

Directorio: C:\Users\PERSONAL\Documents\BUSQUEDA PRODUCTOS\repo
Carga las herramientas con ToolSearch: "select:mcp__apimart__generate_image,mcp__apimart__get_task".

Para cada registro que te asignen (lee su "prompt" en `datos/empaques/prompts.json`):
1. Si ya existe `salida/empaques/<registro>.jpg`, sáltalo.
2. Llama a mcp__apimart__generate_image con:
   model = "gemini-3.1-flash-image-preview"
   idempotency_key = "empaque-<registro>-v1"
   input = { "prompt": <el prompt EXACTO del archivo>, "size": "16:9", "resolution": "1K", "n": 1 }
   Puedes lanzar varias generaciones seguidas antes de consultar (por ejemplo, 5 a la vez).
3. Consulta mcp__apimart__get_task con el task_id EXACTO hasta que "terminal" sea true (tarda unos 15 a 40 s; mientras esperas, lanza o consulta otras). Si falla, reintenta UNA vez con idempotency_key "empaque-<registro>-v2".
4. Con la URL de result.images[0].url[0], ejecuta en Bash desde la carpeta scripts:
   cd "/c/Users/PERSONAL/Documents/BUSQUEDA PRODUCTOS/repo/scripts" && node descargar_empaque.js <registro> "<url>"
   Debe imprimir "ok <registro>".
No uses otros modelos ni otros parámetros. No generes imágenes de registros que no te asignaron (cada imagen cuesta dinero).
Respuesta final de máximo 4 líneas: cuántas generaste, cuáles fallaron y el costo total (suma de "cost").
