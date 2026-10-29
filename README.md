# ANOtaciones

<p align="center">
  
<img width="647" height="628" alt="logo" src="https://github.com/user-attachments/assets/7bb94d63-9b05-4955-a637-2d9febdcfc29" />

</p>


Espacio local tipo Notion para notas, tableros Kanban, bases de datos y favoritos web. Todo corre en el navegador: sin backend ni cuenta. Versión **0.5**.

## Características


<p align="center">
  
<img width="1918" height="1045" alt="about-anotaciones" src="https://github.com/user-attachments/assets/dcaddf33-9356-447c-a2bd-563e7888b0b2" />

</p>

### Notas y wiki

<p align="center">

<img width="1919" height="1047" alt="tablero" src="https://github.com/user-attachments/assets/d58003be-bf3c-4f56-82d4-59f24f445d3a" />

</p>

- Árbol de páginas anidadas, favoritos de página y **recientes**
- Icono emoji por página; barra lateral colapsable (cabecera sin desbordar iconos al expandir)
- Tooltips explicativos en controles
- Búsqueda `Ctrl/Cmd+K` (título, contenido, tipo y etiquetas)
- Editor TipTap: títulos, listas, tareas, código, citas, callouts, separador e imágenes (URL, pegar o soltar; lightbox al doble clic)
- Menú `/` (incluye enlace a página) y formato enriquecido
- Enlaces `[[Título]]` por id estable, títulos sincronizados al renombrar, enlaces rotos marcados
- Panel de **menciones** (enlaces inversos)
- **Etiquetas** globales, **plantillas**, **papelera** con restauración
- **Nota del día** para cualquier fecha, bienvenida, tema claro/oscuro, atajos
- **Historial de versiones** por página (instantánea al salir del editor)

### Productividad

- **Bandeja de entrada** con captura rápida
- **Centro de tareas** (estado, prioridad, vencimiento, etiquetas, vistas guardadas)
- **Calendario** mensual (semana L→D, fechas en formato español `DD/MM/AAAA`):
  - Panel por día: crear/abrir nota del día, añadir tareas, abrir para editar, quitar del día o enviar a papelera
  - Indicador de nota del día y acceso rápido `+` en cada celda
- **Panel de control** configurable (vencen hoy, alta prioridad, bandeja, favoritos de página)
- Metadatos de tarea en el editor (`due` / `priority` / `status` / `inbox`)

### Favoritos web

<p align="center">

<img width="1916" height="1044" alt="gestión_enlaces" src="https://github.com/user-attachments/assets/c7c8c286-9969-436e-b693-c621546f2f6e" />

</p>

Vista propia en la barra lateral (**Favoritos web**), independiente de los favoritos de página:

- Guardar URLs (`http` / `https`) con título, notas, carpeta y etiquetas
- **Carpetas** (árbol; al borrar una carpeta los enlaces pasan a «Sin carpeta»)
- **Etiquetas propias** de favoritos (no se mezclan con las etiquetas de páginas)
- Buscar por título/URL, filtrar por carpeta o etiqueta
- Abrir en pestaña nueva, copiar URL, editar y eliminar

### Tableros y bases de datos

<p align="center">
  
<img width="1918" height="1046" alt="nota-dia" src="https://github.com/user-attachments/assets/cc85e176-da0c-4ef3-a64a-560f70df32e4" />

</p>

- Tablero Kanban (Backlog / Doing / Done) con drag-and-drop
- Base de datos con vistas Tabla, Galería y Tablero
- Tipos de propiedad: texto, select, número, checkbox, **fecha**, **multi-select**, **relación**, **fórmula**
- Filtros, ordenación y agrupación; fórmulas con grafo de dependencias (sin ciclos)
- Duplicar página (sin hijos)

### Portabilidad y datos

- Exportar / importar **JSON** (backup v6: páginas, etiquetas, vistas, adjuntos y favoritos web; fusionar o reemplazar) con informe de validación
- Exportar / importar **Markdown** (página activa) y export **wiki** completa
- Adjuntos vía **OPFS** (fallback a data URL / memoria)
- **PWA** instalable (`manifest` + service worker)
- **Diagnóstico** (conteos, huérfanos, enlaces rotos) y reparación de padres huérfanos
- Aviso si hace tiempo sin copia de seguridad

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4, TipTap, Dexie, Lucide, @dnd-kit.

## Puesta en marcha

```bash
npm install
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm run lint` | Oxlint |
| `npm run preview` | Vista previa del build |
| `npm run pack:linux` | Empaqueta para Ubuntu (`release/anotaciones/`) |
| `npm run pack:deb` | Empaqueta y genera el `.deb` |

## Instalación en Ubuntu

<p align="center">
  
<img width="1918" height="1046" alt="atajos-teclado" src="https://github.com/user-attachments/assets/f95fe1b0-eebb-417d-ade4-0faade4a8882" />

</p>

Empaquetado ligero: el build estático se sirve en `localhost` con Python 3, se muestra un **icono en la bandeja del sistema** (Abrir / Salir) y se abre el navegador en **modo aplicación** (ventana sin pestañas). No hace falta Node.js en el PC donde solo se usa la app.

**Requisitos en el equipo destino**

- Ubuntu (o derivado)
- `python3` (suele venir instalado)
- Para la bandeja: `python3-gi`, `gir1.2-gtk-3.0` y `gir1.2-ayatanaappindicator3-0.1` (o `gir1.2-appindicator3-0.1`); el `.deb` los declara como dependencias
- Google Chrome, Brave o Chromium (recomendado). Se priorizan binarios no-snap; Chromium snap usa un perfil bajo `~/snap/…/common/anotaciones-browser`

**Desde el código (desarrollador)**

```bash
npm install
npm run pack:linux
sudo ./packaging/install.sh
```

O genera e instala un `.deb`:

```bash
npm run pack:deb
sudo dpkg -i release/anotaciones_0.5.0_all.deb
```

Desinstalación:

```bash
sudo ./packaging/uninstall.sh
# o: sudo dpkg -r anotaciones
```

Tras instalar, busca **ANOtaciones** en el menú de aplicaciones o ejecuta `anotaciones`.


<p align="center">
  
<img width="648" height="250" alt="lanzador" src="https://github.com/user-attachments/assets/019c6544-f147-4d8f-9a86-6c6e07bb8133" />

</p>

**Bandeja del sistema**

| Acción | Comportamiento |
|--------|----------------|
| Abrir ANOtaciones | Enfoca la ventana si ya existe; si no, la abre (sin duplicar ventanas en blanco) |
| Salir | Cierra la ventana del navegador, el servidor local y el icono |
| Segundo clic en el lanzador | Enfoca la instancia en ejecución |

Opcional para enfocar ventanas: `wmctrl` o `xdotool`.

**Notas**

- Los datos siguen en IndexedDB del perfil del navegador del lanzador (`http://127.0.0.1:8765`, perfil dedicado `anotaciones-browser`).
- No es un binario nativo; es la SPA local con UX de escritorio.
- Si faltan las librerías de bandeja, la app abre la ventana y avisa por stderr.

## Datos

- IndexedDB `anotacion` (esquema **v7**: `pages`, `tags`, `savedViews`, `attachments`, `revisions`, `bookmarkFolders`, `bookmarkTags`, `bookmarks`)
- Backup JSON versión **6** (incluye favoritos web)
- Fechas internas en ISO `YYYY-MM-DD`; visualización y calendario en locale **es-ES**
- Adjuntos en OPFS cuando el navegador lo permite
- Tema, página activa y último respaldo en `localStorage`
- No se envían datos a ningún servidor

## Fuera de alcance

IA, sync cloud, fórmulas entre distintas bases de datos, arrastre de tareas entre días del calendario, favicons automáticos.
