@echo off
echo Iniciando servidor del juego...
echo.
echo El juego estara disponible en: http://localhost:8000
echo.
echo Presiona CTRL+C para detener el servidor
echo.
cd /d "%~dp0"
python -m http.server 8000
