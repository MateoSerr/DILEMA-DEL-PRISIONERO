# 🎮 Cómo Iniciar el Juego "The Evolution of Trust"

## Opción 1: Usando el archivo .bat (MÁS FÁCIL) ⭐

1. **Doble clic en:** `iniciar-servidor.bat`
2. Se abrirá una ventana con el servidor
3. Abre tu navegador en: **http://localhost:8000**

## Opción 2: Usando Python directamente

1. Abre una terminal/PowerShell en la carpeta `trust-gh-pages`
2. Ejecuta:
   ```bash
   python -m http.server 8000
   ```
3. Abre tu navegador en: **http://localhost:8000**

## Opción 3: Usando Node.js (si lo tienes instalado)

1. Instala http-server:
   ```bash
   npm install -g http-server
   ```
2. En la carpeta `trust-gh-pages`, ejecuta:
   ```bash
   http-server -p 8000
   ```
3. Abre tu navegador en: **http://localhost:8000**

## Opción 4: Abrir directamente en el navegador (limitado)

⚠️ **NOTA:** Algunas características pueden no funcionar si abres `index.html` directamente. 
Es mejor usar un servidor HTTP.

## 🛑 Para Detener el Servidor

- Presiona **CTRL + C** en la ventana de la terminal

## 📊 Estadísticas

Una vez que inicies el juego, verás un botón **"📊 Stats"** en la esquina superior izquierda que mostrará:
- Tiempo de sesión
- Número de juegos y rondas
- Elecciones de cooperar/traicionar
- **Tiempo promedio de decisión** ⏱️ (nueva característica)
- Puntuaciones detalladas

## 💾 Exportar Datos

Puedes descargar todas tus estadísticas en formato JSON haciendo clic en "💾 Descargar Datos" en el panel de estadísticas.
