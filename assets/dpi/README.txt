Video intro DPI (RF1)
---------------------
Opcional: coloca aquí un archivo llamado:

  intro_instrucciones.mp4

Al iniciar una sesión con DPI_FULL_SESSION = true, el juego intentará mostrarlo
y registrará los eventos INSTR_VIDEO_ON (08) e INSTR_VIDEO_OFF (09).

Si el archivo no existe, esos eventos no se registran; INSTR_ON/OFF (10/11) sí.

Sincronía EEG (columna timestamp_eeg_ms)
----------------------------------------
En la consola del navegador (F12), si el reloj del EEG difiere en ms del t0 del juego:

  DPISpec.setEegClockOffsetMs(1234)   // ejemplo: +1234 ms al tiempo relativo

Para quitar el offset: DPISpec.setEegClockOffsetMs(null)
