## Ionic + Capacitor Mobile Strategy

### Objetivo
Documentar la hoja de ruta para empaquetar `adomi-app` (Angular 20, SSR) como aplicaciones móviles iOS y Android usando Ionic y Capacitor, sin ejecutar aún cambios en el código.

### Inventario Angular actual
- Angular 20.3 y TypeScript 5.9 con modo `strict` activado; revisar compatibilidad con Ionic (actualmente alineado a Angular 17, prever uso de rama beta o congelar versión si es necesario).
- Arquitectura con componentes standalone y `libs/shared-*` reutilizables; facilitará compartir vistas en el shell móvil.
- SSR habilitado (`@angular/ssr`) y builders personalizados en `angular.json`; conviene crear un target específico para mobile sin SSR.

### Estrategias de integración
1. **Integración directa (`ng add @ionic/angular`)**
   - Reutilizar proyecto existente, envolver `AppComponent` en `IonApp` y `IonRouterOutlet`.
   - Requiere validar compatibilidad con SSR y ajustar estilos globales para no romper la versión web.
2. **Aplicación Ionic separada**
   - Nuevo proyecto Ionic importando módulos compartidos mediante path mappings o paquete npm interno.
   - Aísla configuraciones, pero duplica pipelines y mantenimiento.
3. **Recomendación híbrida (multi-target)**
   - Mantener core en `libs/` y crear un bootstrap móvil (`src/mobile/main.ts`, `MobileAppComponent`) que cargue Ionic/Capacitor.
   - Permite conservar SSR para web, habilitar overrides específicos (layouts, providers) y compartir lógica de negocio.

### Configuración base de Capacitor
1. Instalar dependencias: `npm i -D @ionic/angular @ionic/angular-server`, `npm i @capacitor/core @capacitor/cli`.
2. Inicializar: `npx cap init adomi-mobile com.adomi.app`.
3. Añadir plataformas: `npx cap add android`, `npx cap add ios`.
4. Ajustar `capacitor.config.ts` para apuntar al directorio de build móvil (`dist/adomi-app-mobile`).
5. Plugins mínimos recomendados:
   - `@capacitor/app`, `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/status-bar`.
   - Según funcionalidades: push (`@capacitor/push-notifications` + Firebase), cámara/archivos (`@capacitor/camera`, `@capacitor/filesystem`), biometría (`@capacitor-fingerprint-auth`), deep links (`@capacitor/app-launcher`).

### Pipeline de build y distribución
1. Crear script `build:mobile` que genere el bundle móvil sin SSR ni prerender.
2. `npx cap copy` y `npx cap sync` tras cada build.
3. **Android**: configurar Gradle (firma, `app/build.gradle`), generar `.aab` para Play Console.
4. **iOS**: usar Xcode (o fastlane/Xcode Cloud) para compilar `.ipa`, gestionar certificados y perfiles.
5. Configurar variables de entorno móviles (`.env.mobile`, `gradle.properties`, `Config.xcconfig`) para claves Stripe, Transbank, API base, etc.
6. Pipeline CI/CD recomendado (GitHub Actions):
   - Job web (SSR) existente.
   - Job móvil Android (runner Linux) -> `bundleRelease` + subida automática a pista interna.
   - Job móvil iOS (runner macOS) -> `gym`/`xcodebuild` + TestFlight.

### QA y checklist de publicación
- **Pruebas funcionales**: flujos críticos (login, reservas, pagos Stripe/TBK, notificaciones) en emuladores y dispositivos físicos (Android 12-14, iOS 16-17).
- **Rendimiento**: medir tiempo de arranque, tamaño del bundle (<10 MB) y optimizar splash/loading con componentes nativos Ionic.
- **UX móvil**: adaptar layouts con `IonTabs/IonRouterOutlet`, gestos y haptics; validar accesibilidad (TalkBack/VoiceOver) y localización ES/EN.
- **Seguridad**: tokens en almacenamiento seguro (Capacitor Secure Storage), permisos declarados, políticas de privacidad actualizadas.
- **App Store / Play Store**: preparar íconos/adaptive icons, capturas, propiedad de dominios y formularios de privacidad (Data Safety, App Privacy).

### Próximos pasos sugeridos
1. Validar compatibilidad de Ionic con Angular 20; considerar downgrade temporal o esperar Ionic 8 estable.
2. Prototipo de shell móvil (ej. sección `client/configuracion`) para medir ajustes de estilos y rendimiento.
3. Refactor de componentes críticos para responsividad auténtica y soporte táctil.
4. Definir pipeline CI (signing keys, secretos) y proceso de beta cerrada (TestFlight, Play Internal Testing).
5. Documentar actualización de analytics/eventos para distinguir uso web vs móvil.

### Referencias clave
- `package.json`: versiones Angular/TypeScript y dependencias principales.
- `angular.json`: builders y configuraciones actuales (SSR, assets, styles).
- Documentación oficial: [Ionic Angular](https://ionicframework.com/docs/angular/overview), [Capacitor](https://capacitorjs.com/docs), [Angular Standalone](https://angular.dev/guide/standalone-components).






