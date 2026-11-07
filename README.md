# GIRA — mini plataforma de sorteos (MVP 1.0)

Ruleta gratuita, hecha con HTML, CSS y JavaScript vanilla. No necesita Node, base de datos, API keys ni backend.

## Publicar en GitHub Pages

1. Creá un repositorio en GitHub (público o uno que permita Pages en tu plan).
2. Subí **el contenido** de esta carpeta a la raíz del repositorio: `index.html`, `css/` y `js/`.
3. En **Settings → Pages → Build and deployment**, elegí **Deploy from a branch**, rama **main**, carpeta **/(root)** y guardá.
4. Accedé al enlace que GitHub Pages muestre. Puede tardar unos minutos en publicarse.

Para probarlo localmente, abrilo mediante un servidor HTTP local (los scripts `type="module"` pueden bloquearse si abrís `index.html` con `file://`):

```bash
python -m http.server 8000
```

Luego abrí http://localhost:8000/ . Alternativa: VS Code + extensión Live Server.

## Funcionalidades

- Nombres separados por saltos de línea, comas, tabulaciones o punto y coma; pegar desde Google Sheets.
- Importación TXT/CSV simple de una columna de nombres.
- Selección uniforme mediante `crypto.getRandomValues()` y rechazo para evitar sesgo de módulo.
- Animación `requestAnimationFrame`, con el ganador elegido **antes** de animar.
- Opción de excluir ganadores de sorteos siguientes. «Reiniciar participantes» reincorpora a los excluidos.
- Historial de los últimos 250 ganadores, opción de copiar ganador y pantalla completa.
- Autoguardado en `localStorage` del navegador, sin servidores.

## Límites conocidos del MVP

- CSV: importación **simple**, no parsea comillas y delimitadores RFC 4180 de múltiples columnas. Para listas complejas, prepará una columna TXT o pegá la columna desde Sheets.
- Cada aparición de un nombre es un boleto independiente: si aparece dos veces, tiene el doble de posibilidades.
- Para garantizar que **cada participante único** tenga una sola oportunidad, hay que deduplicar la lista antes del sorteo.
- Si editás la lista, se reinician las exclusiones, pero no el historial.
- Todo se guarda solamente en ese navegador/dispositivo. Borrar los datos del sitio los elimina.
- No es un sistema de auditoría pública o verificable, ni una herramienta antifraude. Un organizador puede alterar el código, la lista o los datos locales. Para sorteos regulados o con premios importantes hará falta backend, registro inmutable y controles adicionales.
- Web Crypto requiere contexto seguro (HTTPS o localhost); GitHub Pages proporciona HTTPS.
- Las fuentes DM Sans y Space Grotesk se descargan de Google Fonts cuando hay conexión; hay fuentes de respaldo del sistema.

## Estructura

```text
index.html         — interfaz
css/style.css      — estilos responsive
js/app.js          — estado, botones, listas, almacenamiento e historial
js/wheel.js        — dibujo de la ruleta y animación
js/random.js       — selección aleatoria uniforme
js/storage.js      — persistencia local
```

## Siguientes mejoras sugeridas

Confeti al ganar, identidad visual configurable, exportar reporte, modo público/operador, importación CSV con varias columnas, soporte accesible de teclado mejorado y registros auditables si el uso lo justifica.

**Licencia:** código inicial libre para adaptar a tus proyectos.
