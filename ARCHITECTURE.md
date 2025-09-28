# Arquitectura del proyecto

Este documento describe la estructura de carpetas del workspace Angular.

```text
adomi-app/
 â”œâ”€ projects/
 â”‚  â”œâ”€ client-app/
 â”‚  â”‚  â””â”€ src/
 â”‚  â”‚     â”œâ”€ app/
 â”‚  â”‚     â”‚  â”œâ”€ components/
 â”‚  â”‚     â”‚  â”œâ”€ pages/
 â”‚  â”‚     â”‚  â”œâ”€ features/
 â”‚  â”‚     â”‚  â”œâ”€ services/
 â”‚  â”‚     â”‚  â”œâ”€ guards/
 â”‚  â”‚     â”‚  â”œâ”€ interceptors/
 â”‚  â”‚     â”‚  â”œâ”€ directives/
 â”‚  â”‚     â”‚  â”œâ”€ pipes/
 â”‚  â”‚     â”‚  â”œâ”€ layouts/
 â”‚  â”‚     â”‚  â””â”€ state/
 â”‚  â”‚     â”œâ”€ assets/
 â”‚  â”‚     â””â”€ environments/
 â”‚  â””â”€ provider-app/
 â”‚     â””â”€ src/
 â”‚        â”œâ”€ app/
 â”‚        â”‚  â”œâ”€ components/
 â”‚        â”‚  â”œâ”€ pages/
 â”‚        â”‚  â”œâ”€ features/
 â”‚        â”‚  â”œâ”€ services/
 â”‚        â”‚  â”œâ”€ guards/
 â”‚        â”‚  â”œâ”€ interceptors/
 â”‚        â”‚  â”œâ”€ directives/
 â”‚        â”‚  â”œâ”€ pipes/
 â”‚        â”‚  â”œâ”€ layouts/
 â”‚        â”‚  â””â”€ state/
 â”‚        â”œâ”€ assets/
 â”‚        â””â”€ environments/
 â””â”€ libs/
    â”œâ”€ core/
    â”‚  â””â”€ src/lib/
    â”‚     â”œâ”€ services/
    â”‚     â”œâ”€ interceptors/
    â”‚     â”œâ”€ guards/
    â”‚     â”œâ”€ http/
    â”‚     â”œâ”€ tokens/
    â”‚     â”œâ”€ utils/
    â”‚     â””â”€ config/
    â”œâ”€ shared-ui/
    â”‚  â””â”€ src/lib/
    â”‚     â”œâ”€ components/
    â”‚     â”œâ”€ directives/
    â”‚     â”œâ”€ pipes/
    â”‚     â””â”€ styles/
    â”œâ”€ shared-utils/
    â”‚  â””â”€ src/lib/
    â”‚     â”œâ”€ utils/
    â”‚     â”œâ”€ pipes/
    â”‚     â””â”€ directives/
    â””â”€ models/
       â””â”€ src/lib/
          â”œâ”€ interfaces/
          â”œâ”€ enums/
          â””â”€ types/
```

## GuÃ­a rÃ¡pida
- `projects/client-app` y `projects/provider-app`: aplicaciones Angular independientes.
- `libs/core`: servicios transversales (auth, API), interceptores, guards, utilidades.
- `libs/shared-ui`: componentes UI reutilizables, directivas y pipes de presentaciÃ³n.
- `libs/shared-utils`: utilidades puras, pipes/directivas sin dependencias de UI.
- `libs/models`: contratos e interfaces compartidas entre apps y libs.

> Nota: por ahora solo se han creado carpetas vacÃ­as. Los mÃ³dulos y cÃ³digo se aÃ±adirÃ¡n en siguientes tareas.
