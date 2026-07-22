# Chatbot de atención al cliente con historial en base de datos

Bot de Telegram construido en n8n que responde automáticamente preguntas frecuentes (horarios, precios, disponibilidad) comparando el mensaje del cliente contra un catálogo guardado en MongoDB, y registra cada conversación como historial. Cuando no encuentra respuesta, avisa a un chat de administración en tiempo real y guarda la pregunta como pendiente de revisión.

## Estructura del proyecto

```
docker-compose.yml                    MongoDB + mongo-express (UI admin en localhost:8081)
.env.example                          Variables de entorno de ejemplo
.mcp.json.example                     Plantilla de configuración del servidor MCP de n8n
mongo/seed-faqs.js                    Colecciones, índices y FAQs de ejemplo
n8n/customer-service-chatbot.json     Workflow original: matching por palabras clave (sin IA)
n8n/chatbot-clinica-dental-ia.json    Workflow actual en producción: AI Agent (Gemini) + MongoDB como herramienta
```

> **Nota:** `n8n/chatbot-clinica-dental-ia.json` es el workflow que corre actualmente. Usa un AI Agent (Google Gemini) que consulta la colección `faqs` en MongoDB como herramienta y responde de forma natural, en vez del matching por palabras clave del workflow original. Ambos archivos son exportaciones de referencia — al importar necesitas volver a configurar las credenciales (Telegram, MongoDB, Google Gemini) y, en el caso del segundo, el `chatId` del admin dentro del nodo "Notificar al admin".

## 1. Levantar MongoDB

```bash
cp .env.example .env
# editar .env si quieres cambiar usuario/password
docker compose up -d
```

Esto levanta:
- **MongoDB** en `localhost:27017`
- **mongo-express** (interfaz web para ver/editar la base) en `http://localhost:8081`

## 2. Cargar las FAQs de ejemplo

```bash
mongosh "mongodb://admin:changeme@localhost:27017/chatbot_atencion_cliente?authSource=admin" mongo/seed-faqs.js
```

(Ajusta usuario/password si los cambiaste en `.env`.) Esto crea:
- Colección `faqs` con 8 preguntas de ejemplo (horarios, precios, disponibilidad, otros) e índices en `keywords` y `active`.
- Colección `conversations` (historial) con índices en `chat_id`, `status` y `timestamp`.

Puedes editar/agregar FAQs directamente desde mongo-express (`http://localhost:8081`) sin tocar el workflow — el bot busca dinámicamente en la colección `faqs`.

## 3. Crear el bot de Telegram

1. En Telegram, habla con **@BotFather**.
2. Envía `/newbot` y sigue las instrucciones (nombre y username del bot).
3. BotFather te entrega un **token** (algo como `123456789:ABC...`). Guárdalo.
4. Obtén el `chat_id` del admin (el chat/negocio que recibirá las notificaciones de preguntas sin responder):
   - Habla con **@userinfobot** en Telegram, o
   - Envía un mensaje a tu bot desde la cuenta/grupo admin y consulta `https://api.telegram.org/bot<TOKEN>/getUpdates` para ver el `chat.id`.

## 4. Importar el workflow en n8n

1. En tu instancia de n8n (ya la tienes corriendo) → **Import from File** → selecciona `n8n/customer-service-chatbot.json`.
2. Configura las credenciales:
   - **Telegram API**: en cada nodo de tipo Telegram (Trigger y los 3 `sendMessage`), crea/selecciona una credencial con el token del bot del paso 3.
   - **MongoDB**: en los nodos `Buscar FAQs activas`, `Guardar conversación (respondida)` y `Guardar conversación (sin responder)`, crea/selecciona una credencial con el connection string, por ejemplo:
     ```
     mongodb://admin:changeme@localhost:27017/chatbot_atencion_cliente?authSource=admin
     ```
3. Abre el nodo **Config** y reemplaza `PON_AQUI_EL_CHAT_ID_DEL_ADMIN` por el `chat_id` real obtenido en el paso 3.
4. Guarda y **activa** el workflow.

## 5. Cómo funciona el workflow

```
Recibir mensaje de Telegram
  → Config (agrega adminChatId)
  → Normalizar mensaje (limpia texto, extrae chat_id/username)
  → Buscar FAQs activas (MongoDB find)
  → Emparejar con FAQ (compara palabras clave, elige mejor match)
  → ¿Hubo coincidencia?
      SÍ → Responder con FAQ (Telegram) + Guardar conversación respondida (MongoDB)
      NO → Responder mensaje genérico (Telegram, al cliente)
         + Notificar al admin (Telegram, al chat configurado en Config)
         + Guardar conversación sin responder (MongoDB)
```

El matching es por palabras clave: cada FAQ tiene una lista `keywords`; el mensaje del cliente se normaliza (minúsculas, sin tildes/puntuación) y se cuenta cuántas keywords de cada FAQ aparecen en el mensaje. Gana la FAQ con más coincidencias.

## 6. Probar

Desde Telegram, escríbele a tu bot:
- `¿a qué hora abren?` → debería responder con el horario, y guardar en `conversations` un documento con `status: "answered"`.
- `¿tienen wifi?` (no cubierto por las FAQs) → debería responder el mensaje genérico, llegar una notificación al chat admin, y guardar `status: "unanswered"`.

Verifica en mongo-express (`http://localhost:8081`, colección `conversations`) que ambos casos quedaron registrados.

## 7. Mantenimiento

- **Agregar/editar FAQs**: edita la colección `faqs` en mongo-express (o vía `mongosh`). No requiere tocar el workflow.
- **Ver preguntas sin responder**: filtra `conversations` por `status: "unanswered"` para saber qué FAQs te falta agregar.
- **Próximo paso sugerido**: cuando quieras sumar WhatsApp, el mismo patrón (buscar FAQ → responder → guardar conversación) se reutiliza; solo cambia el trigger y el nodo de envío de mensaje (Telegram → WhatsApp Business API/Twilio).
