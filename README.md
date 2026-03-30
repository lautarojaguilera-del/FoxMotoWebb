# FoxMoto Repuestos - Catálogo con Firebase

Este proyecto está dividido en dos partes para un rendimiento óptimo:

1.  **Frontend (Vercel):** La web rápida que los clientes ven. Se conecta directamente a Firebase para mostrar los productos en tiempo real.
2.  **Scraper (Render):** Un servicio en segundo plano que recorre el catálogo de Dux Software y actualiza los precios y stock en Firebase automáticamente.

## 🚀 Despliegue en Vercel (Frontend)

1.  Conecta tu repositorio a **Vercel**.
2.  Vercel detectará el proyecto Vite.
3.  **Configuración:**
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
4.  **Variables de Entorno:** No necesitas ninguna especial para el frontend, ya que la configuración de Firebase está en el archivo `firebase-applet-config.json` (que se incluye en el build).

## 🛠️ Despliegue en Render (Scraper)

1.  Crea un **Web Service** en Render usando el mismo repositorio.
2.  **Runtime:** Selecciona **Docker** (Render usará el `Dockerfile` que ya está en el proyecto).
3.  **Plan:** El plan **Free** es suficiente.
4.  **Variables de Entorno:**
    *   `NODE_ENV`: `production`
    *   `PORT`: `3000`
5.  **¿Qué hace este servicio?**
    *   Al arrancar, inicia un proceso de scraping automático.
    *   Cada 30 minutos, vuelve a revisar el catálogo para actualizar Firebase.
    *   No necesitas entrar a la URL de Render, el servicio trabaja solo en segundo plano.

## 📁 Estructura de Firebase

*   **Colección `products`:** Contiene todos los repuestos. El ID del documento es el SKU.
*   **Documento `status/current`:** Muestra el progreso del scraping actual (página, total de productos, estado).

---

### 🔧 Notas Técnicas
*   El scraper usa **Puppeteer** con una imagen Docker optimizada para Render.
*   La web usa **Firestore onSnapshot** para actualizaciones instantáneas sin recargar la página.
