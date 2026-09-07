@echo off
rem Abre el dashboard de camello sin agente ni tokens: regenera data/dashboard.html y lo abre en el navegador.
rem Doble clic en este archivo o `dashboard` desde la terminal en esta carpeta.
node "%~dp0dist\src\cli\camello.js" dashboard %*
