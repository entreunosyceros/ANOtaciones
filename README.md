# ANOtaciones

<p align="center">
  
<img width="647" height="628" alt="logo" src="https://github.com/user-attachments/assets/7bb94d63-9b05-4955-a637-2d9febdcfc29" />

</p>


Espacio local tipo Notion para notas, tableros Kanban y bases de datos. Todo corre en el navegador: sin backend ni cuenta.

## Características

### Notas y wiki

<p align="center">

<img width="1919" height="934" alt="anotaciones" src="https://github.com/user-attachments/assets/199bc48f-4874-48d1-90ed-66767361696b" />

</p>

- Árbol de páginas anidadas, favoritos y **recientes**
- Icono emoji por página
- Búsqueda `Ctrl/Cmd+K`
- Editor TipTap: títulos, listas, tareas, código, citas, callouts, **separador** e **imágenes** (URL, pegar o soltar)
- Menú `/` y formato enriquecido (barra al seleccionar)
- Enlaces `[[Título]]`, breadcrumbs
- **Nota del día** (una página por fecha)
- Pantalla de bienvenida en el primer uso
- Autosave IndexedDB + tema claro/oscuro

### Tableros y bases de datos

- Tablero Kanban (Backlog / Doing / Done) con drag-and-drop
- Base de datos con vistas Tabla, Galería y Tablero
- Duplicar página (sin hijos)

### Respaldo

- **Exportar / Importar** JSON desde el pie de la barra lateral

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4, TipTap, Dexie, Lucide, @dnd-kit, Vitest.

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
| `npm test` | Tests |
| `npm run lint` | Oxlint |

## Datos

- IndexedDB `anotacion` (nombre interno; la marca visible es ANOtaciones)
- Tema y página activa en `localStorage`
- No se envían datos a ningún servidor

## Fuera de alcance

IA, sync cloud, papelera, fórmulas entre bases de datos.
