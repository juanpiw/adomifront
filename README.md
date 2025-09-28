# Adomi App - Angular 20 + SSR

## Requisitos
- Node.js 18+ (recomendado 20 LTS)
- npm 9+

## InstalaciÃ³n
```bash
npm install
```

## Ejecutar en modo SPA (sin SSR)
```bash
npm start
# o
ng serve
```

- Abre `http://localhost:4200`

## Ejecutar en modo SSR (Angular Universal)
```bash
npm run dev:ssr
```
- ServirÃ¡ SSR en `http://localhost:4200`

### Build de producciÃ³n SSR
```bash
npm run build:ssr
npm run serve:ssr
```
- Build generada en `dist/adomi-app/browser` y `dist/adomi-app/server`

## Scripts relevantes
- `start`: `ng serve`
- `build`: `ng build`
- `dev:ssr`: desarrollo con SSR
- `build:ssr`: compila SSR
- `serve:ssr`: sirve la build SSR

## Estructura de carpetas
Consulta `ARCHITECTURE.md` para el detalle de la estructura (apps, libs y subcarpetas).

## Notas
- Si `4200` estÃ¡ ocupado, cierra procesos viejos o usa un puerto alternativo.
- SSR agrega `src/main.server.ts`, `src/server.ts` y config en `angular.json`.
