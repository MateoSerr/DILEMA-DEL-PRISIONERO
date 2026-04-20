# Borrador para el documento IEEE – Proyecto modular

**Índice:**
- Portada y Abstract  
- **I. INTRODUCCIÓN**  
- **II. TRABAJOS RELACIONADOS**  
- **III. DESCRIPCIÓN DEL DESARROLLO DEL PROYECTO MODULAR**  
- **IV. ESPECIFICACIÓN TÉCNICA (DPI + BIOSEÑAL)**  
- **V. RESULTADOS OBTENIDOS DEL PROYECTO**  
- **VI. CONCLUSIONES Y TRABAJO A FUTURO**  
- Reconocimientos  
- Módulos (Justificación I, II, III)  
- Referencias  

---

## PORTADA (primera página)

**Título (24 pt, centrado):** Simulación del Dilema del Prisionero en Entornos Interactivos

**Autores (11 pt):** Mateo Sebastian Serrano Perez, Eden Abdiel Bautista Martinez, Jose Luis David Bonilla Carranza

**Institución (10 pt, cursiva):** *Centro Universitario de Ciencias Exactas e Ingenierías (CUCEI, UDG)*

**Correos (9 pt, Courier):**  
mateo.serrano4968@alumnos.udg.mx  
eden.bautista5052@alumnos.udg.mx  
jose.bcarranza@academicos.udg.mx  

**Abstract (máximo ~150 palabras):**

Este proyecto presenta una simulación interactiva del Dilema del Prisionero para analizar la toma de decisiones en contextos de cooperación y desconfianza. Se desarrolló un entorno basado en web que permite al usuario jugar rondas iteradas contra oponentes con distintas estrategias (cooperar siempre, traicionar siempre, tit-for-tat, etc.), registrando elecciones y puntuaciones. Como extensión del experimento, se plantea integrar una visualización de “reacción cerebral” que muestre, en ventanas de pocos segundos (menos de 6 s), una representación simplificada de la actividad cerebral asociada a cada resultado (recompensa, tentación, castigo, engaño), con el fin de vincular la respuesta cognitiva y emocional del usuario con su siguiente decisión (cooperar o mentir). El sistema sirve como plataforma para estudiar la evolución de la confianza en entornos controlados y como base para futuros experimentos que relacionen teoría de juegos con modelos de procesamiento cognitivo. Se utilizan tecnologías web estándar y librerías de gráficos y animación para garantizar portabilidad y reproducibilidad.

**Palabras clave:** Dilema del prisionero, teoría de juegos, simulación interactiva, cooperación, confianza, toma de decisiones, visualización de actividad cerebral, entornos web.

**Repositorio de código:** [aquí va la URL de tu repositorio]  
**Versión actual del código:** [ej. v1.0, commit, o fecha]  
**Licencia legal del código:** [ej. Creative Commons Zero, MIT, etc.]

---

## I. INTRODUCCIÓN

El Dilema del Prisionero es un modelo clásico de teoría de juegos que ilustra el conflicto entre el interés individual y el beneficio colectivo. En su versión iterada, las decisiones de cooperar o traicionar en una ronda influyen en las siguientes, lo que permite estudiar la evolución de la confianza y la reciprocidad. Este documento describe un proyecto modular que implementa una simulación interactiva de dicho juego en un entorno web, permitiendo al usuario tomar decisiones en tiempo real frente a oponentes con estrategias predefinidas.

El objetivo principal es ofrecer una herramienta educativa y experimental que facilite el análisis de la toma de decisiones en contextos de cooperación y desconfianza. Como parte del alcance del proyecto, se plantea incorporar una representación de la “reacción cerebral” del jugador ante cada resultado del juego (por ejemplo, cuando fue engañado o cuando obtuvo una recompensa), mostrando en intervalos cortos (menos de 6 segundos) una visualización simplificada de la actividad cerebral (p. ej. ondas o regiones activas), para discutir cómo dicha respuesta podría relacionarse con la siguiente decisión: cooperar de nuevo o responder con desconfianza. El documento está organizado en secciones que describen trabajos relacionados, el desarrollo del proyecto, los resultados y las conclusiones.

---

## II. TRABAJOS RELACIONADOS

### A. Teoría de juegos y Dilema del Prisionero

El Dilema del Prisionero y sus variantes iteradas han sido ampliamente estudiados en economía, psicología y ciencias de la computación. Las estrategias más conocidas incluyen “siempre cooperar”, “siempre traicionar”, “tit-for-tat” (replicar la última jugada del oponente) y estrategias que incorporan ruido o memoria limitada. En este proyecto se toman como referencia implementaciones interactivas y educativas que permiten al usuario experimentar el juego de forma guiada.

### B. Simulaciones interactivas y entornos web

Las simulaciones basadas en web permiten desplegar experimentos accesibles y reproducibles. En este trabajo se utiliza un enfoque modular con componentes reutilizables (botones, sliders, visualización de pagos, registro de rondas) y una arquitectura basada en eventos para separar la lógica del juego de la interfaz. Esto facilita extender el sistema con nuevos módulos, como la visualización de “reacción cerebral” propuesta.

### C. Cognición y toma de decisiones

La relación entre actividad cerebral y decisiones en contextos sociales (confianza, reciprocidad, castigo) ha sido abordada en neurociencia y economía conductual. En el proyecto se plantea una representación simplificada de esta relación: a cada resultado del juego (recompensa R, tentación T, castigo P, engaño S) se asocia una ventana temporal corta (menos de 6 segundos) en la que se muestra una visualización de “ondas” o “regiones” cerebrales activas, para ilustrar de forma didáctica cómo la respuesta cognitiva y emocional podría influir en la siguiente elección (cooperar o no). Esta representación es conceptual y no sustituye mediciones reales de EEG o fMRI; su propósito es apoyar la discusión en el documento y la presentación del experimento. Para experimentos con bioseñales reales, se requiere una especificación técnica que defina la sincronización entre estímulos y registros (p. ej. triggers TTL), el balanceo de condiciones y el registro de eventos; ello se aborda en la sección IV.

---

## III. DESCRIPCIÓN DEL DESARROLLO DEL PROYECTO MODULAR

Esta sección responde a la pregunta *cómo se ha hecho el proyecto modular*: se describe la metodología del equipo, los requerimientos, las tecnologías, el repositorio, las pruebas y el proceso de implementación.

### A. Metodología de trabajo del equipo

El desarrollo se organizó en fases iterativas: (1) análisis del juego de referencia (The Evolution of Trust) y definición del alcance; (2) diseño de la arquitectura modular (slides, simulaciones, core) y reparto de tareas por módulo; (3) implementación por componentes (motor de diapositivas, lógica del Dilema del Prisionero, guardado, estadísticas); (4) integración y pruebas funcionales; (5) documentación y especificación técnica para extensión con bioseñal. Se utilizaron reuniones de seguimiento y un repositorio compartido para control de versiones y revisión de código.

### B. Requerimientos principales

- **Funcionales:** Simulación del Dilema del Prisionero en modo único e iterado; múltiples oponentes con estrategias distintas (tit-for-tat, siempre cooperar, siempre traicionar, grudge, prober); guardado y carga de partida; registro de puntuaciones y tiempo de decisión; exportación de datos (p. ej. JSON) para análisis.
- **No funcionales:** Interfaz web accesible desde navegador; ejecución en servidor local sin dependencias de backend; arquitectura extensible para añadir módulos (visualización de reacción cerebral, integración con bioseñal); documentación y especificación técnica para experimentos con EEG/ERPs.

### C. Tecnologías utilizadas

Todo lo que se utilizó en el desarrollo del proyecto se resume a continuación:

- **Web estática:** HTML, CSS y JavaScript. La estructura del proyecto organiza los archivos en la **raíz** (index.html, words.html, etc.), la carpeta **css** (estilos y fuentes) y la carpeta **js** (lógica, core, sims, slides, lib, save, stats).
- **Bibliotecas JavaScript:** PIXI.js (gráficos y animación), Howler.js (audio), Tween.js (animaciones y transiciones), Q (promesas), MinPubSub (publicación/suscripción de eventos), Pegasus (peticiones HTTP para carga de recursos).
- **UI y estilos:** Balloon.css para elementos de interfaz y tooltips.
- **Servidor local:** Python (módulo `http.server`, p. ej. `python -m http.server 8000`), Node.js o el script .bat incluido en el proyecto para servir la aplicación en el navegador; sin base de datos ni backend obligatorio.
- **Persistencia y datos:** LocalStorage para guardado de partida; exportación de estadísticas en JSON.

### D. Repositorio público del código

El código fuente del proyecto se encuentra disponible en un repositorio público [indicar URL en la portada y aquí, ej. GitHub/GitLab]. Incluye la estructura de carpetas (js/core, js/sims, js/slides, css, assets), el archivo index.html como punto de entrada, los módulos de simulación (PD.js, Iterated.js, Tournament.js, etc.) y la documentación (README, INSTRUCCIONES.md, este documento). La versión actual y la licencia legal del código (p. ej. Creative Commons Zero, MIT) se especifican en la portada del documento.

### E. Pruebas realizadas

- **Pruebas funcionales:** Verificación del flujo completo del juego (intro, primera decisión, rondas iteradas, cambio de oponente, fin de partida); comprobación de guardado y carga desde LocalStorage; validación del cálculo de pagos (R, T, P, S) y de las estrategias de los oponentes.
- **Pruebas de usabilidad:** Ejecución en navegador con servidor local; revisión de tiempos de carga, reproducción de sonidos y animaciones; comprobación del panel de estadísticas y de la exportación de datos.
- **Pruebas de regresión:** Tras añadir el sistema de guardado y el módulo de estadísticas, se repitió el flujo de juego para asegurar que no se introdujeron fallos en la lógica existente.

No se realizaron pruebas automatizadas con framework de testing; las pruebas fueron manuales y documentadas por el equipo.

### F. Arquitectura del sistema

El sistema se compone de un front-end web que carga recursos (imágenes, sonidos, textos), un motor de diapositivas que orquesta las pantallas (intro, juego único, juego iterado, torneo, etc.) y módulos de simulación que implementan la lógica del Dilema del Prisionero (cálculo de pagos, estrategias de oponentes, registro de rondas). La comunicación entre componentes se realiza mediante un bus de eventos (publicación/suscripción), lo que permite añadir módulos como el de estadísticas o el de “reacción cerebral” sin modificar el núcleo del juego.

### G. Flujo del juego iterado

En el modo iterado, el usuario elige en cada ronda entre cooperar o traicionar. El oponente responde según su estrategia (tit-for-tat, siempre traicionar, etc.). Tras cada ronda se calculan los pagos (R, T, P, S) y se actualiza la puntuación. El sistema guarda el progreso (oponente actual, número de ronda, puntuación) para permitir reanudar la partida. En este flujo es donde se plantea insertar la visualización de reacción cerebral: tras mostrar el resultado de la ronda, se mostraría durante menos de 6 segundos una representación de la “actividad cerebral” asociada a ese resultado, y a continuación el usuario tomaría su siguiente decisión.

### H. Proceso de implementación

Se siguió un orden incremental: (1) Integración del código base del juego (slides, assets, librerías); (2) implementación y ajuste del motor de diapositivas y de los slides del juego iterado; (3) desarrollo del módulo de guardado (GameSaveManager, lectura/escritura en LocalStorage) y su enlace con los eventos de fin de ronda y cambio de oponente; (4) desarrollo del módulo de estadísticas (StatsManager, registro de rondas, tiempo de decisión, exportación JSON) y su suscripción a los eventos del juego; (5) pruebas integradas y corrección de errores; (6) redacción de la especificación técnica DPI + bioseñal y del documento del proyecto. Cada módulo se implementó de forma que pudiera activarse o desactivarse sin romper el flujo principal, respetando la arquitectura basada en eventos.

### I. Propuesta de visualización de reacción cerebral (para la presentación del proyecto)

La idea del experimento se puede describir en el documento de la siguiente forma:

- **Objetivo:** Ilustrar la relación entre el resultado de una ronda (por ejemplo, “me mintieron” o “ambos cooperamos”) y la respuesta cognitiva/emocional del jugador, y cómo esta podría influir en la siguiente decisión (seguir cooperando o responder con desconfianza).
- **Representación:** Se plantea un panel o “apartado” visual (por ejemplo, una vista simplificada de la cabeza con regiones o ondas) que reaccione según el tipo de payoff:
  - **Recompensa (R):** cooperación mutua → actividad asociada a recompensa/confianza.
  - **Tentación (T):** yo traicioné y gané → actividad asociada a beneficio propio.
  - **Castigo (P):** ambos traicionaron → actividad asociada a conflicto o frustración.
  - **Engaño (S):** yo cooperé y me traicionaron → actividad asociada a decepción o desconfianza.
- **Duración:** La visualización se mostraría en una ventana corta (menos de 6 segundos) tras cada ronda, antes de que el usuario elija de nuevo, para mantener el ritmo del juego y enfatizar la secuencia: resultado → “reacción cerebral” → siguiente decisión.

En la presentación (oral o póster) se puede mostrar un esquema o mock-up de este panel y explicar que, en una implementación futura, podría conectarse a datos de EEG o usarse como herramienta didáctica para discutir neurociencia y teoría de juegos.

---

## IV. ESPECIFICACIÓN TÉCNICA (DPI + BIOSEÑAL)

Para que la simulación pueda usarse en experimentos con registro de bioseñales (EEG, potenciales relacionados con eventos —ERPs—), se definen los siguientes requisitos técnicos, alineados con especificaciones estándar de paradigmas DPI (Dilema del Prisionero Iterado) con bioseñal.

### A. Sincronización estímulo–adquisición

- **Requisito crítico:** La coincidencia entre los triggers TTL (señal enviada al equipo de adquisición de EEG) y los onsets de la interfaz gráfica (GUI) debe mantenerse dentro de una ventana de **±1 ms** para garantizar la validez del análisis de potenciales relacionados con eventos (ERPs).
- **Implementación sugerida:** Emisión de un trigger TTL en cada evento relevante (inicio de ronda, presentación de opciones, respuesta del usuario, feedback de resultado). Timestamps de alta resolución en el lado de la aplicación y registro en el archivo de eventos para posterior alineación con la bioseñal.

### B. Balanceo de condiciones

- **Objetivo por bloque:** En diseños experimentales controlados, se recomienda una distribución aproximada de **25 % ± 5 %** para cada uno de los cuatro resultados posibles en cada bloque de ensayos:
  - **CC** (ambos cooperan),
  - **CT** (jugador coopera, oponente traiciona),
  - **TC** (jugador traiciona, oponente coopera),
  - **TT** (ambos traicionan).
- **Mecanismos:** (1) Mezcla ponderada de estrategias del oponente con ajuste dinámico; (2) restricción de rachas largas (máximo N consecutivos del mismo resultado); (3) jitter temporal en la ventana de decisión (CHOICE_COMP) para evitar anticipación y variar el intervalo entre estímulos.

### C. Registro de eventos y exportación

- **Esquema de datos:** Definición de un archivo de eventos por sesión (p. ej. CSV) con columnas obligatorias como: timestamp, código de evento, tipo de resultado (CC/CT/TC/TT), elección del jugador, elección del oponente, payoff del jugador, número de ronda, bloque, etc.
- **Validador:** Implementar un validador automático del esquema que verifique: presencia de todas las columnas obligatorias, tipos de datos correctos, valores dentro de rangos permitidos, secuencia temporal monótona creciente y cobertura completa de eventos por sesión. Esto asegura la compatibilidad con pipelines de análisis (ERPs, estadística por ensayo).

Esta especificación permite planear la extensión del proyecto hacia experimentos con bioseñal sin modificar el núcleo de la simulación; el módulo de “reacción cerebral” puede operar en modo visualización didáctica (actual) o en modo sincronizado con adquisición real de EEG.

---

## V. RESULTADOS OBTENIDOS DEL PROYECTO

- Se implementó una simulación funcional del Dilema del Prisionero en entorno web, con juego único e iterado y múltiples oponentes con estrategias distintas.
- Se integró un sistema de guardado y carga de partida y un módulo de estadísticas (rondas, puntuaciones, tiempo de decisión, exportación de datos).
- Se definió la arquitectura y el flujo necesarios para incorporar, en una fase posterior, la visualización de “reacción cerebral” en ventanas de menos de 6 segundos tras cada ronda.
- Se redactó una especificación técnica (DPI + bioseñal) que establece requisitos de sincronización (TTL, ±1 ms), balanceo de condiciones (CC/CT/TC/TT, 25 % ± 5 %) y registro de eventos (CSV, validador), para futura integración con EEG/ERPs.
- La herramienta es accesible vía navegador y servidor local, cumpliendo con los requisitos de un proyecto modular reproducible y extensible.

---

## VI. CONCLUSIONES Y TRABAJO A FUTURO

- La simulación desarrollada permite estudiar el Dilema del Prisionero de forma interactiva y sirve como base para experimentos sobre cooperación y confianza.
- La incorporación de una visualización de reacción cerebral (conceptual o conectada a sensores) permitiría vincular teoría de juegos con modelos de procesamiento cognitivo y emocional en la presentación y en futuras versiones del proyecto.
- Como trabajo a futuro se contempla: (1) implementar el módulo de visualización de “ondas” o regiones cerebrales según el payoff; (2) realizar pruebas con usuarios para medir tiempos de decisión y correlaciones con la historia de la partida; (3) implementar la especificación técnica DPI + bioseñal (triggers TTL, balanceador de condiciones, exportación CSV validada); (4) en un escenario avanzado, integrar adquisición de EEG y análisis de ERPs correlacionados con las decisiones en el juego.

---

## RECONOCIMIENTOS (sin numerar)

[Aquí pueden agradecer a tutores, compañeros o instituciones que hayan apoyado el proyecto sin ser autores.]

---

## MÓDULOS – JUSTIFICACIÓN Y CUMPLIMIENTO DE CRITERIOS

Referencia: Criterios de aprobación de Proyectos Modulares, Ingeniería en Computación, Comité de Titulación (Septiembre 2019).  
http://www.cucei.udg.mx/carreras/computacion/sites/default/files/adjuntos/criteriosaprobacion_0.pdf  

---

### Módulo I – Justificación de Arquitectura y Programación de Sistemas

**Relación con el proyecto:** El proyecto modular se apoya en decisiones de arquitectura y programación en cada uno de los criterios del Módulo 1:

- **1.1 Decidir el uso de los lenguajes de programación:** Se eligió una pila web estática: HTML, CSS y JavaScript para el front-end, y Python (u otras opciones) para el servidor local. La decisión se justifica por portabilidad, ausencia de backend obligatorio y facilidad de despliegue en laboratorio o navegador.
- **1.2 Emplear Bases de Datos y/o Estructuras de Datos:** Se utilizan estructuras de datos en memoria (estado del juego, puntuaciones, historial de rondas) y persistencia vía LocalStorage; la exportación de estadísticas en JSON implica estructuras de datos definidas para análisis posterior.
- **1.3 Decidir la metodología de programación a seguir:** Se siguió una metodología iterativa por fases (análisis, diseño modular, implementación por componentes, integración, documentación), con reparto de tareas y uso de control de versiones.
- **1.4 Argumentar con elementos de Ingeniería de Software:** Se aplican conceptos de ingeniería de software: definición de requerimientos funcionales y no funcionales, arquitectura modular (core, sims, slides, save, stats), patrón publicación/suscripción (MinPubSub) y separación de responsabilidades.
- **1.5 Estructurar el modelado del sistema:** El sistema se modela en capas: interfaz (HTML/CSS/JS, Balloon.css), motor de diapositivas (Slideshow), módulos de simulación (PD, Iterated, Tournament), módulos de soporte (Loader, Words, GameSaveManager, StatsManager) y flujo de eventos entre ellos.

**Conclusión Módulo I:** El proyecto cumple con los criterios 1.1 a 1.5 del Módulo de Arquitectura y Programación de Sistemas.

---

### Módulo II – Justificación de Sistemas Inteligentes

**Relación con el proyecto:** El proyecto aborda toma de decisiones y estrategias en el Dilema del Prisionero, alineado con ramas de inteligencia artificial y con modelo matemático y algoritmos justificados:

- **2.1 Rama o aplicación de IA (al menos una):** Se cubre **2.1.7 Sistemas expertos** y **2.1.9 Árboles de decisión.** Cada oponente (tit-for-tat, grudge, prober, siempre cooperar, siempre traicionar) implementa reglas de decisión que pueden representarse como árboles de decisión o sistemas expertos simples (si el otro hizo X, entonces yo hago Y; memoria de traiciones, etc.).
- **2.2 Formular el modelo matemático correspondiente:** El Dilema del Prisionero tiene un modelo matemático bien definido: matriz de pagos (R, T, P, S), juego repetido, estrategias puras (cooperar/traicionar) y payoff esperado por ronda. En el documento y en el código se utiliza explícitamente este modelo.
- **2.3 Justificar la selección de los algoritmos empleados:** Las estrategias implementadas (tit-for-tat, grudge, prober, etc.) son las estándar en literatura de teoría de juegos y evolución de la cooperación; su selección se justifica por reproducibilidad de experimentos y comparación con resultados clásicos (p. ej. torneos de Axelrod).

**Conclusión Módulo II:** El proyecto cumple con los criterios 2.1, 2.2 y 2.3 del Módulo de Sistemas Inteligentes.

---

### Módulo III – Justificación de Sistemas Distribuidos

**Relación con el proyecto:** En su estado actual, el proyecto es una aplicación web estática servida por un servidor HTTP local (Python, Node o .bat), con un único cliente (navegador) y sin comunicación entre varios dispositivos ni procesamiento distribuido. Según los criterios del PDF:

- **3.1 Sistema descentralizado / compartir recursos:** No se ha implementado aún (no hay componentes concurrentes distribuidos, ni base de datos distribuida, ni sockets en tiempo real, etc.).
- **3.2 Algoritmo que use modelo cliente/servidor o P2P:** El uso de un servidor HTTP ya existente (p. ej. `python -m http.server`) no basta por sí solo según la nota del criterio. Sería necesario desarrollar lógica explícita cliente/servidor o P2P (p. ej. partidas en red, sincronización de estado entre dos o más clientes).
- **3.3 Comunicación entre al menos dos dispositivos:** No aplica actualmente; no hay dos dispositivos intercambiando información. Varias pestañas o interfaces que consultan el mismo sistema centralizado no cuentan como distribuido según la nota.
- **3.4 Justificar protocolos de comunicación:** No aplica sin un sistema distribuido implementado.

**Conclusión Módulo III:** Con lo implementado hasta ahora, el proyecto **no cumple** los criterios del Módulo de Sistemas Distribuidos. La justificación de este módulo quedaría como **trabajo a futuro** o **extensión**: por ejemplo, partidas en red (dos jugadores en distintos dispositivos), backend que distribuya sesiones o resultados, o sincronización en tiempo real vía WebSockets, cumpliendo 3.1–3.4. Se recomienda consultar con el Comité de Titulación o la Coordinación de carrera si es aceptable presentar solo Módulos I y II, o qué extensión mínima se requiere para dar por cumplido el Módulo III.

---

## ANÁLISIS: ¿CON MULTIJUGADOR SE CUMPLEN LOS TRES MÓDULOS?

**Resumen:** Sí, **si el multijugador se implementa bien**, con eso se cubren los tres módulos. No hace falta cambiar nada de lo que ya cumple Módulos I y II. Lo que sigue aclara qué debe tener ese multijugador para que el Comité no lo rechace.

### Módulos I y II (ya cumplen)

- **Módulo I** y **Módulo II** no dependen del multijugador. Siguen cumpliéndose con la arquitectura actual, las estrategias (TFT, grudge, etc.), la matriz de pagos y la metodología ya descritas. Añadir multijugador no los debilita.

### Módulo III: qué debe tener el multijugador para cumplir

Según el PDF de criterios, el multijugador debe cubrir **de forma explícita** lo siguiente:

| Criterio | Qué pide el PDF | Qué debe tener su multijugador |
|----------|------------------|---------------------------------|
| **3.1** (alguna opción) | Ej. 3.1.6: información en tiempo real por **sockets** para sincronización. | Usar **WebSockets** (o equivalente) para que el servidor envíe/reciba mensajes en tiempo real con ambos clientes. No basta solo HTTP “a veces”; debe haber sincronización vía sockets. |
| **3.2** | **Desarrollar** un algoritmo cliente/servidor o P2P. **No es válido solo usar un servicio ya creado.** | Ustedes deben **programar el servidor** (p. ej. Python con Flask-SocketIO o Node con socket.io): lógica de salas/partidas, recibir jugadas de ambos, **calcular pagos en el servidor**, enviar resultado a los dos. No vale solo usar Firebase u otro SaaS sin lógica propia. |
| **3.3** | Comunicación entre **al menos dos dispositivos**. No cuenta “varias interfaces que solo consultan un sistema centralizado”. | **Dos dispositivos reales** (dos PCs, o PC + celular, o dos navegadores en dos máquinas). Cada uno es un cliente que envía sus decisiones y recibe el estado de la partida. No basta dos pestañas en la misma PC que solo consulten una API. |
| **3.4** | Justificar los protocolos de comunicación. | En el documento: indicar que usan **WebSocket** (y, si aplica, JSON para mensajes), para qué (sincronización en tiempo real, baja latencia) y brevemente el flujo (crear partida, unir, enviar jugada, recibir resultado). |

### Riesgos si lo hacen “a medias”

- **Solo subir el juego a un hosting:** no cumple; es usar un servidor ya creado (3.2).
- **Solo una API REST que ambos clientes consulten:** el PDF dice que “diferentes interfaces que consultan un sistema centralizado” no se considera distribuido (nota 3.3); mejor que haya **sincronización en tiempo real** (sockets).
- **Servidor que solo reenvía mensajes:** si el servidor no hace lógica (p. ej. no calcula R/T/P/S ni mantiene estado de partida), el Comité podría decir que no “desarrollaron” un algoritmo cliente/servidor suficiente (3.2). Conviene que el **servidor calcule pagos y estado** y envíe resultados a ambos.

### Conclusión del análisis

- **Sí:** con **solo** añadir un **modo multijugador bien implementado** (servidor propio con lógica de partida + WebSockets + dos dispositivos + protocolo justificado en el documento), se cumplen los **tres módulos**.
- **Condición:** el multijugador debe incluir: (1) servidor desarrollado por ustedes que gestione partidas y calcule pagos, (2) comunicación en tiempo real vía sockets (p. ej. WebSockets), (3) dos dispositivos como clientes, (4) en el documento, justificación del protocolo (3.4).

---

## REFERENCIAS (sin numerar, formato IEEE)

[Deben completar con formato IEEE, por ejemplo:]

1. N. Case, "The Evolution of Trust," 2017. [Online]. Available: http://ncase.me/trust/
2. R. Axelrod, *The Evolution of Cooperation*. New York: Basic Books, 1984.
3. [Añadir referencias sobre teoría de juegos, dilema del prisionero, neurociencia y toma de decisiones según las que hayan usado.]

---

*Este archivo es un borrador para copiar y pegar en la plantilla IEEE (dos columnas, márgenes y fuentes según las instrucciones del formato). Ajusten títulos, numeración y referencias al formato final del documento.*
  