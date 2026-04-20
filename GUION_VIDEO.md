# Guion para video: Cómo se juega y cómo se guardan los datos

Video corto que muestra el uso del juego y el sistema de guardado y estadísticas.

---

## Antes de grabar

- Tener el juego abierto en el navegador (http://localhost:8000 o donde lo sirvan).
- Asegurarse de que el servidor está corriendo (por ejemplo con `iniciar-servidor.bat` o `python -m http.server 8000`).

---

## PARTE 1: Cómo se juega (aprox. 1–2 min)

### 1. Inicio
- **Pantalla:** Página de carga y luego la primera pantalla del juego.
- **Decir o poner en texto:**  
  *"Simulación del Dilema del Prisionero. Al cargar, vemos la introducción al juego iterado."*

### 2. Primera decisión
- **Pantalla:** Aparecen los dos botones: **Cooperar** y **Traicionar**.
- **Decir o poner en texto:**  
  *"En cada ronda puedes elegir Cooperar o Traicionar. El oponente tiene una estrategia fija (por ejemplo tit-for-tat)."*
- **Acción:** Haz clic en uno de los dos (ej. **Cooperar**).

### 3. Una ronda completa
- **Pantalla:** Se muestra la jugada del oponente, la matriz de pagos y el resultado (monedas, caras).
- **Decir o poner en texto:**  
  *"Se muestra el resultado de la ronda: quién cooperó, quién traicionó y los puntos (recompensa, tentación, castigo o engaño)."*
- **Acción:** Espera a que terminen las animaciones y aparezcan de nuevo los botones.

### 4. Varias rondas y cambio de oponente
- **Pantalla:** Juega 2–3 rondas más (alterna Cooperar y Traicionar si quieres).
- **Decir o poner en texto:**  
  *"Puedes jugar varias rondas contra el mismo oponente. Al terminar las rondas de ese oponente, el juego pasa al siguiente automáticamente."*
- **Acción:** Sigue hasta que cambie de oponente (scratch/transición) o hasta tener suficiente para mostrar el marcador.

### 5. Marcador y estadísticas
- **Pantalla:** Muestra el marcador en pantalla (tú vs oponente) y abre el panel de **Stats** (botón de estadísticas, si lo tienen).
- **Decir o poner en texto:**  
  *"El marcador va sumando puntos por ronda. En el panel de estadísticas se ven rondas jugadas, tiempo de decisión y opción de exportar datos."*

---

## PARTE 2: Cómo se guardan los datos (aprox. 1 min)

### 1. Guardado automático durante la partida
- **Pantalla:** Sigue en medio de una partida (varias rondas jugadas).
- **Decir o poner en texto:**  
  *"El progreso se guarda automáticamente en el navegador: oponente actual, número de ronda y puntuación. Si cierras la pestaña y vuelves a abrir el juego, puedes continuar donde lo dejaste."*

### 2. Demostración de “cerrar y volver”
- **Acción:** Cierra la pestaña del juego (o minimiza y vuelve a abrir la misma URL).
- **Pantalla:** Vuelves a la misma URL; el juego carga y muestra que retoma la partida (mismo oponente, misma ronda o siguiente).
- **Decir o poner en texto:**  
  *"Al reabrir, el juego recupera el estado guardado y sigue desde la última ronda."*

### 3. Exportar datos (si tienen el botón)
- **Pantalla:** Abre el panel de estadísticas y haz clic en **“Descargar datos”** o similar.
- **Decir o poner en texto:**  
  *"Desde estadísticas se puede exportar un archivo JSON con las partidas, rondas, decisiones y puntuaciones para analizarlas después."*
- **Acción:** Muestra el archivo descargado (nombre .json) o la ventana de “Guardar como”.

### 4. Resumen final (opcional)
- **Pantalla:** Pantalla del juego o título del proyecto.
- **Decir o poner en texto:**  
  *"Resumen: el juego se usa eligiendo Cooperar o Traicionar en cada ronda; los datos se guardan solos en el navegador y además se pueden exportar en JSON para análisis."*

---

## Tips para grabar

- Habla despacio o usa subtítulos si el video es sin voz.
- Si algo falla (ej. no carga el guardado), graba de nuevo solo ese tramo y córtalo en el editor.
- Duración sugerida total: 2–4 minutos (1–2 min juego + 1 min guardado/exportar).
- Puedes usar OBS, la grabación de Windows (Win + G) o el celular filmando la pantalla.

---

## Checklist antes de publicar

- [ ] Se ve cómo se elige Cooperar o Traicionar.
- [ ] Se ve al menos un resultado de ronda (pagos/monedas).
- [ ] Se explica o se muestra que el progreso se guarda solo.
- [ ] Se muestra reabrir el juego y que continúa la partida.
- [ ] Se muestra la exportación de datos (JSON) si existe el botón.
