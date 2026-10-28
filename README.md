# ANOtaciones

<p align="center">
  
<img width="647" height="628" alt="logo" src="https://github.com/user-attachments/assets/7bb94d63-9b05-4955-a637-2d9febdcfc29" />

</p>


Espacio local tipo Notion para notas, tableros Kanban y bases de datos. Todo corre en el navegador: sin backend ni cuenta. Versión **0.5**.

## Características

### Notas y wiki

<p align="center">

<img width="1919" height="934" alt="anotaciones" src="https://github.com/user-attachments/assets/199bc48f-4874-48d1-90ed-66767361696b" />

</p>

- Árbol de páginas anidadas, favoritos y **recientes**
- Icono emoji por página; barra lateral colapsable
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
- **Panel de control** configurable (vencen hoy, alta prioridad, bandeja, favoritos)
- Metadatos de tarea en el editor (`due` / `priority` / `status` / `inbox`)

### Tableros y bases de datos

<p align="center">
<img width="1919" height="932" alt="atajos-teclado" src="https://github.com/user-attachments/assets/7dd8b4ff-25c9-4478-840c-109084aa598d" />
</p>

- Tablero Kanban (Backlog / Doing / Done) con drag-and-drop
- Base de datos con vistas Tabla, Galería y Tablero
- Tipos de propiedad: texto, select, número, checkbox, **fecha**, **multi-select**, **relación**, **fórmula**
- Filtros, ordenación y agrupación; fórmulas con grafo de dependencias (sin ciclos)
- Duplicar página (sin hijos)

### Portabilidad y datos

- Exportar / importar **JSON** (fusionar o reemplazar atómico) con informe de validación
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

## Datos

- IndexedDB `anotacion` (esquema v6: `pages`, `tags`, `savedViews`, `attachments`, `revisions`)
- Fechas internas en ISO `YYYY-MM-DD`; visualización y calendario en locale **es-ES**
- Adjuntos en OPFS cuando el navegador lo permite
- Tema, página activa y último respaldo en `localStorage`
- No se envían datos a ningún servidor

## Fuera de alcance

IA, sync cloud, fórmulas entre distintas bases de datos, arrastre de tareas entre días del calendario.
