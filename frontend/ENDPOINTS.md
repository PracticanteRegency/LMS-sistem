# Endpoints para Lecciones y Archivos

## Archivos Necesarios (Placeholders - Cambiar según tu API real)

### 1. Upload File Endpoint
**Función:** `uploadFile(file: File)` en `src/services/Capacitaciones.js`

**Ruta placeholder:** `POST /capacitaciones/upload-file/`

**Request:**
- Content-Type: multipart/form-data
- Body: 
  ```
  file: <File object>
  ```

**Response (esperado):**
```json
{
  "url": "http://localhost:8000/media/uploads/archivo_123.jpg"
}
```

O alternativa (backend puede retornar):
```json
{
  "file_url": "http://localhost:8000/media/uploads/archivo_123.jpg"
}
```

El código intenta leer `response.url` o `response.file_url`. Ajusta el campo según tu API.

---

### 2. Create Leccion Endpoint
**Función:** `createLeccion(data: object)` en `src/services/Capacitaciones.js`

**Ruta placeholder:** `POST /capacitaciones/lecciones/`

**Request:**
- Content-Type: application/json
- Body:
```json
{
  "titulo_leccion": "Mi Lección",
  "tipo_leccion": "formulario|video|imagen|pdf",
  "duracion": "20:30",
  "descripcion": "Descripción de la lección",
  "intentos": 1,
  "url": "http://localhost:8000/media/uploads/...",  // si es video o url
  "preguntas": [
    {
      "pregunta": "¿Cuál es la respuesta?",
      "tipo_pregunta": "opcion_multiple",
      "url_multimedia": "http://localhost:8000/media/uploads/pregunta.jpg",
      "respuestas": [
        {
          "valor": "Respuesta A",
          "es_correcto": 1,
          "url_archivo": "http://localhost:8000/media/uploads/respuesta_a.jpg"  // si la respuesta tiene imagen
        },
        {
          "valor": "Respuesta B",
          "es_correcto": 0
        }
      ]
    }
  ]
}
```

**Response (esperado):**
```json
{
  "leccion": {
    "id": 1,
    "titulo_leccion": "Mi Lección",
    ...
  }
}
```

---

## Instrucciones para Actualizar Endpoints

1. **Cambia la ruta de upload en `src/services/Capacitaciones.js`:**
   ```javascript
   const response = await axios.post(API_URL + 'TU_RUTA_AQUI/', formData, {
   ```

2. **Cambia la ruta de crear lección en `src/services/Capacitaciones.js`:**
   ```javascript
   const response = await axios.post(API_URL + 'TU_RUTA_AQUI/', data, {
   ```

3. **Valida que el nombre del campo de URL en response sea correcto:**
   - Si es `file_url` en lugar de `url`, el código detecta ambos: `response.data.url || response.data.file_url`

4. **Si tu API espera otro nombre para el campo de URL de archivos en respuesta (ej: `url_archivo` vs `url_file` vs `multimedia_url`), avísame y lo ajusto en el código.**

---

## Flujo de Creación de Lección (desde el Front)

1. Usuario rellena formulario en la card modal.
2. Usuario pulsa "Crear lección".
3. **El frontend hace:**
   - Para cada archivo adjunto (lesson_file, preguntas[*].file, respuestas[*].file):
     - POST a `/capacitaciones/upload-file/` (con FormData).
     - Recibe URL y la guarda en la estructura (temp.url, pregunta.url_multimedia, respuesta.url_archivo).
   - POST a `/capacitaciones/lecciones/` con JSON (sin archivos, solo URLs).
   - Si tiene éxito, guarda en estado local `modulos` y cierra la card.

---

## Notas

- Los errores de upload de archivos se capturan pero **no bloquean** la creación de la lección (continúa sin URL del archivo si falla).
- Los archivos se procesan **en paralelo** (en bucles secuenciales por simplicidad; si quieres `Promise.all`, avísame).
- El campo `url_archivo` en respuesta es un placeholder; cambia a lo que tu API espere.

