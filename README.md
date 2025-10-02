# 🎨 Adomi Frontend

Aplicación web Angular para la plataforma Adomi - Conectando profesionales de servicios con clientes.

## 📋 **Características Principales**

- ✅ **Angular 20** con componentes standalone
- ✅ **Angular Universal (SSR)** para mejor SEO
- ✅ **Sistema de temas** (claro/oscuro) global
- ✅ **Componentes reutilizables** en librería compartida
- ✅ **Autenticación completa** con roles (cliente/proveedor)
- ✅ **Dashboard diferenciado** por tipo de usuario
- ✅ **Integración con Stripe** para pagos
- ✅ **Sistema de alertas** para planes de suscripción
- ✅ **Diseño responsive** para móviles y desktop
- ✅ **Onboarding** interactivo para nuevos usuarios

## 🛠️ **Tecnologías**

- **Angular 20** - Framework principal
- **TypeScript** - Lenguaje de programación
- **SCSS** - Estilos con variables CSS
- **Angular Universal** - Server-Side Rendering
- **RxJS** - Programación reactiva
- **Angular Router** - Navegación SPA

## 🚀 **Instalación y Configuración**

### **1. Instalar Dependencias**
```bash
npm install
```

### **2. Configurar Variables de Entorno**
Crear archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000'
};
```

### **3. Ejecutar en Desarrollo**

#### **Modo SPA (Single Page Application)**
```bash
ng serve
```
Accede a: `http://localhost:4200`

#### **Modo SSR (Server-Side Rendering)**
```bash
ng serve --ssr
```
Accede a: `http://localhost:4200`

### **4. Compilar para Producción**

#### **SPA**
```bash
ng build
```

#### **SSR**
```bash
ng build --ssr
```

## 🏗️ **Arquitectura del Proyecto**

```
adomi-app/
├── src/
│   ├── app/
│   │   ├── auth/              # Autenticación
│   │   │   ├── login/         # Pantalla de login
│   │   │   ├── register/      # Pantalla de registro
│   │   │   ├── select-plan/   # Selección de planes
│   │   │   ├── checkout/      # Checkout con Stripe
│   │   │   ├── payment-success/ # Éxito de pago
│   │   │   ├── payment-error/   # Error de pago
│   │   │   ├── forgot/        # Recuperar contraseña
│   │   │   └── reset-password/ # Restablecer contraseña
│   │   ├── dash/              # Dashboard de proveedores
│   │   │   ├── layout/        # Layout con sidebar
│   │   │   └── pages/         # Páginas del dashboard
│   │   ├── client/            # Dashboard de clientes
│   │   │   ├── layout/        # Layout para clientes
│   │   │   └── pages/         # Páginas del cliente
│   │   ├── services/          # Servicios Angular
│   │   └── pages/             # Páginas públicas
│   ├── libs/
│   │   └── shared-ui/         # Componentes reutilizables
│   │       ├── ui-input/      # Componente de input
│   │       ├── ui-button/     # Componente de botón
│   │       ├── ui-dropdown/   # Componente de dropdown
│   │       ├── ui-date/       # Componente de fecha
│   │       ├── ui-calendar/   # Componente de calendario
│   │       ├── user-card/     # Tarjeta de usuario
│   │       ├── theme-switch/  # Switch de tema
│   │       └── plan-upgrade-alert/ # Alerta de actualización
│   └── environments/          # Variables de entorno
├── angular.json               # Configuración de Angular
└── package.json              # Dependencias
```

## 🎨 **Sistema de Temas**

### **Tema Claro/Oscuro Global**
El sistema de temas utiliza variables CSS para cambiar dinámicamente entre modo claro y oscuro.

```scss
:root {
  --color-primary: #2563eb;
  --color-background: #ffffff;
  --color-text: #1f2937;
  --color-muted: #6b7280;
}

.dark-theme {
  --color-primary: #3b82f6;
  --color-background: #111827;
  --color-text: #f9fafb;
  --color-muted: #9ca3af;
}
```

### **Componente ThemeSwitch**
```html
<theme-switch size="sm"></theme-switch>
```

## 🔐 **Sistema de Autenticación**

### **Flujos de Usuario**

#### **Clientes (Gratis)**
```
Registro → Onboarding → Dashboard Cliente
```

#### **Proveedores (Con Pago)**
```
Registro → Selección de Plan → Stripe Checkout → Onboarding → Dashboard Proveedor
```

### **Servicios de Autenticación**
- `AuthService` - Gestión de autenticación
- `SessionService` - Gestión de sesión
- `PlanService` - Gestión de planes y expiraciones

## 📱 **Dashboards Diferenciados**

### **Dashboard de Proveedores** (`/dash`)
- 🏠 **Inicio** - Resumen general
- 📅 **Agenda** - Gestión de citas
- 💰 **Ingresos** - Finanzas y pagos
- 📈 **Estadísticas** - Métricas de negocio
- ⭐ **Promoción** - Marketing y visibilidad
- 💬 **Mensajes** - Comunicación con clientes
- 💼 **Mis Servicios** - Gestión de servicios
- 👤 **Mi Perfil** - Configuración personal

### **Dashboard de Clientes** (`/client`)
- 🗓️ **Mis Reservas** - Citas programadas
- ⭐ **Profesionales Favoritos** - Proveedores guardados
- 👤 **Mi Perfil** - Información personal
- 💳 **Métodos de Pago** - Gestión de pagos
- ⚙️ **Configuración** - Preferencias
- 🚪 **Cerrar Sesión** - Salir del sistema

## 🚨 **Sistema de Alertas de Planes**

### **Componente PlanUpgradeAlert**
Alertas inteligentes que aparecen en el dashboard según el estado del plan:

- **🔴 Plan Expirado** - Alerta crítica, requiere acción inmediata
- **🟡 Plan por Vencer** - Advertencia si expira en ≤7 días
- **🔵 Informativo** - Sugerencia de actualización

### **Integración en Dashboard**
```html
<plan-upgrade-alert 
  [planInfo]="planInfo" 
  [show]="showPlanAlert"
  (upgrade)="onPlanUpgrade()"
  (dismiss)="onPlanAlertDismiss()">
</plan-upgrade-alert>
```

## 🧩 **Componentes Reutilizables**

### **UiInputComponent**
Input con múltiples variantes:
```html
<ui-input 
  label="Email" 
  type="email" 
  placeholder="tu@email.com"
  [error]="emailError">
</ui-input>
```

### **UiButtonComponent**
Botones con diferentes estilos:
```html
<ui-button 
  type="primary" 
  [loading]="isLoading"
  (click)="onSubmit()">
  Enviar
</ui-button>
```

### **UiCalendarComponent**
Calendario para gestión de citas:
```html
<ui-calendar 
  [events]="appointments"
  (dateSelected)="onDateSelect($event)">
</ui-calendar>
```

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Características Móviles**
- Sidebar colapsible con hamburger menu
- Navegación táctil optimizada
- Componentes adaptativos
- Alertas responsivas

## 🚀 **Despliegue**

### **Variables de Entorno de Producción**
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.adomiapp.cl'
};
```

### **Comandos de Despliegue**

#### **SPA**
```bash
ng build --configuration production
```

#### **SSR**
```bash
ng build --ssr --configuration production
```

### **Servidor Web**
Configurar servidor web (Nginx/Apache) para servir archivos estáticos y proxy para SSR.

## 🧪 **Testing**

### **Ejecutar Tests**
```bash
# Tests unitarios
ng test

# Tests E2E
ng e2e

# Tests con coverage
ng test --code-coverage
```

### **Testing de Componentes**
```typescript
// Ejemplo de test para componente
describe('PlanUpgradeAlertComponent', () => {
  it('should show critical alert for expired plan', () => {
    component.planInfo = { is_expired: true };
    expect(component.getAlertType()).toBe('expired');
  });
});
```

## 🔧 **Desarrollo**

### **Agregar Nuevos Componentes**
1. Crear en `src/libs/shared-ui/`
2. Implementar con `@Component` standalone
3. Exportar en `index.ts`
4. Documentar props y eventos

### **Agregar Nuevas Páginas**
1. Crear en `src/app/` correspondiente
2. Configurar ruta en `app.routes.ts`
3. Implementar navegación
4. Agregar al menú correspondiente

### **Estilos y Temas**
- Usar variables CSS para colores
- Implementar soporte para tema oscuro
- Seguir patrones de diseño existentes
- Mantener consistencia visual

## 📊 **Performance**

### **Optimizaciones Implementadas**
- **Lazy Loading** para rutas
- **OnPush** change detection
- **TrackBy** functions para listas
- **Image optimization**
- **Bundle splitting**

### **Métricas**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## 🐛 **Debugging**

### **Herramientas de Desarrollo**
- **Angular DevTools** - Extension del navegador
- **Redux DevTools** - Para estado de la aplicación
- **Network Tab** - Para debugging de API calls

### **Logs de Consola**
```typescript
// Habilitar logs detallados
console.log('Debug info:', data);
```

## 📞 **Soporte**

Para soporte técnico o consultas:
- **Email**: frontend@adomiapp.cl
- **Documentación**: Este README
- **Issues**: GitHub Issues

---

**¡Adomi Frontend - Experiencia de usuario excepcional! 🎨**