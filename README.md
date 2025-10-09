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
- ✅ **Sistema de notificaciones** completo con gestión por perfil
- ✅ **Diseño responsive** para móviles y desktop
- ✅ **Onboarding** interactivo para nuevos usuarios

## 🛠️ **Tecnologías**

- **Angular 20** - Framework principal
- **TypeScript** - Lenguaje de programación
- **SCSS** - Estilos con variables CSS
- **Angular Universal** - Server-Side Rendering
- **Angular Animations** - Animaciones y transiciones
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
│   │   │   ├── layout/        # Layout con sidebar y topbar
│   │   │   └── pages/         # Páginas del dashboard
│   │   │       ├── home/      # Dashboard principal
│   │   │       ├── perfil/    # Gestión de perfil
│   │   │       ├── agenda/    # Gestión de agenda
│   │   │       ├── ingresos/  # Gestión de ingresos
│   │   │       ├── estadisticas/ # Estadísticas
│   │   │       ├── promocion/ # Promoción y marketing
│   │   │       ├── mensajes/  # Mensajes
│   │   │       └── servicios/ # Gestión de servicios
│   │   ├── client/            # Dashboard de clientes
│   │   │   ├── layout/        # Layout para clientes
│   │   │   └── pages/         # Páginas del cliente
│   │   │       ├── explorar/  # Explorar servicios
│   │   │       ├── perfil-trabajador/ # Perfil de trabajador
│   │   │       ├── reservas/  # Gestión de reservas
│   │   │       ├── favoritos/ # Favoritos con componentes migrados
│   │   │       ├── perfil/    # Perfil del cliente
│   │   │       ├── pagos/     # Métodos de pago
│   │   │       └── configuracion/ # Configuración
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
│   │       ├── plan-upgrade-alert/ # Alerta de actualización
│   │       ├── topbar/        # Barra superior
│   │       ├── icon/          # Sistema de iconos
│   │       ├── notifications/ # Sistema de notificaciones
│   │       │   ├── notification-bell/     # Campana de notificaciones
│   │       │   ├── notification-panel/    # Panel desplegable
│   │       │   ├── notification-container/ # Contenedor principal
│   │       │   ├── services/              # Servicio de notificaciones
│   │       │   └── models/                # Modelos y tipos
│   │       ├── time-filter/   # Filtro de tiempo con iconos elegantes
│   │       ├── review-modal/  # Modal de reseñas
│   │       ├── progress-perfil/ # Progreso del perfil
│   │       ├── info-basica/   # Información básica
│   │       ├── seccion-fotos/ # Upload de fotos
│   │       ├── sobre-mi/      # Descripción personal
│   │       ├── mis-servicios/ # Servicios ofrecidos
│   │       ├── portafolio/    # Portafolio de trabajos
│   │       ├── ubicacion-disponibilidad/ # Ubicación y horarios
│   │       ├── verificacion-perfil/ # Verificación
│   │       ├── calendar-mensual/ # Calendario mensual
│   │       ├── dashboard-grafico/ # Gráficos de estadísticas
│   │       ├── dashboard-resumen/ # Resumen de citas
│   │       ├── day-detail/    # Detalle de día
│   │       ├── horarios-config/ # Configuración de horarios
│   │       ├── sidebar-agenda/ # Sidebar de agenda
│   │       ├── profile-hero/  # Hero del perfil
│   │       ├── booking-panel/ # Panel de reservas
│   │       ├── trust-stats/   # Estadísticas de confianza
│   │       ├── reviews/       # Sistema de reseñas
│   │       ├── portfolio/     # Portafolio
│   │       ├── faq/           # Preguntas frecuentes
│   │       ├── reservas/      # Componentes de reservas
│   │       ├── inicio-header/ # Header del dashboard
│   │       ├── inicio-ingresos-mes/ # Ingresos mensuales
│   │       ├── inicio-ingresos-dia/ # Ingresos diarios
│   │       ├── inicio-solicitudes/ # Solicitudes
│   │       └── inicio-proxima-cita/ # Próxima cita
│   │       ├── services/            # Componentes de servicios del proveedor
│   │       │   ├── services-header/           # Encabezado "Mis Servicios"
│   │       │   ├── services-list/             # Lista + estado vacío + loader
│   │       │   ├── service-card/              # Tarjeta individual de servicio
│   │       │   ├── service-form/              # Formulario crear/editar servicio
│   │       │   ├── confirmation-modal/        # Modal de confirmación de eliminación
│   │       │   └── feedback-toast/            # Toast de feedback (éxito/error/etc.)
│   │       ├── statistics/          # Componentes de estadísticas del proveedor
│   │       │   ├── statistics-header/         # Encabezado de estadísticas
│   │       │   ├── date-filter/               # Filtro de períodos
│   │       │   ├── kpi-cards/                 # Tarjetas de KPIs
│   │       │   ├── revenue-chart/             # Gráfico de ingresos y citas
│   │       │   ├── services-chart/            # Gráfico de servicios populares
│   │       │   └── reviews-table/             # Tabla de reseñas recientes
│   │       ├── favorites/           # Componentes de favoritos
│   │       │   ├── hero-section/    # Sección hero con búsqueda
│   │       │   ├── categories-section/ # Sección de categorías
│   │       │   ├── professional-card/ # Tarjeta de profesional
│   │       │   ├── favorites-section/ # Sección de favoritos
│   │       │   └── recommended-section/ # Sección de recomendados
│   │       ├── payment-methods/     # Componentes de métodos de pago
│   │       │   ├── payment-methods-header/ # Encabezado de métodos de pago
│   │       │   ├── saved-cards-section/ # Sección de tarjetas guardadas
│   │       │   ├── balance-card/    # Tarjeta de saldo con estados
│   │       │   ├── transactions-table/ # Tabla de transacciones
│   │       │   └── add-card-modal/  # Modal para añadir tarjeta
│   └── environments/          # Variables de entorno
├── templates/                 # Templates HTML/CSS originales
│   └── componentes/           # Componentes migrados
│       ├── perfil-trabajador/ # Componentes de perfil
│       ├── agenda-trabajador/ # Componentes de agenda
│       ├── inicio/            # Componentes de dashboard
│       ├── agenda/            # Componentes de perfil público
│       ├── componentes-chat/  # Componentes de chat
│       ├── perfil/            # Componentes de perfil de cliente
│       ├── componentes-favoritos/ # Componentes de favoritos
│       ├── componentes_metodo_pago/ # Componentes de métodos de pago
│       ├── servicios_componente/ # Componentes de servicios del proveedor
│       ├── promociones_componente/ # Componentes de promociones del proveedor
│       └── estadisticas_componente/ # Componentes de estadísticas del proveedor
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

#### Ruta de Gestión de Servicios
- Página: `/dash/servicios`
- Componentes:
  - `ServicesHeaderComponent` (encabezado + botón añadir)
  - `ServicesListComponent` (lista, loader, estado vacío)
  - `ServiceCardComponent` (tarjeta individual con editar/eliminar)
  - `ServiceFormComponent` (crear/editar con categorías y personalizado "Otro")
  - `ConfirmationModalComponent` (confirmación de eliminación)
  - `FeedbackToastComponent` (toasts de éxito/error/advertencia/info)


### **Dashboard de Clientes** (`/client`)
- 🔍 **Explorar** - Buscar servicios y profesionales
- 🗓️ **Mis Reservas** - Gestión de citas programadas
- ❤️ **Favoritos** - Profesionales guardados con componentes migrados
- 💬 **Conversaciones** - Chat con profesionales
- 👤 **Mi Perfil** - Información personal
- 💳 **Métodos de Pago** - Gestión de tarjetas, saldo y transacciones
- ⚙️ **Configuración** - Preferencias del usuario
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

## 🔔 **Sistema de Notificaciones**

### **Arquitectura Completa**
Sistema robusto de notificaciones migrado desde templates HTML/CSS a componentes Angular reutilizables, diseñado para manejar múltiples perfiles de usuario con diferentes tipos de notificaciones.

### **Componentes del Sistema**

#### **NotificationBellComponent**
- **Campana de notificaciones** con contador de no leídas
- **Badge animado** para notificaciones nuevas
- **Integración con iconos** del sistema

#### **NotificationPanelComponent**
- **Panel desplegable** con lista de notificaciones
- **Separación** entre notificaciones no leídas y leídas
- **Animaciones suaves** de entrada/salida
- **Estado vacío** con mensaje amigable

#### **NotificationContainerComponent**
- **Contenedor principal** que orquesta bell + panel
- **Manejo de estado** abierto/cerrado
- **Click fuera** para cerrar
- **Navegación automática** con Router

### **Tipos de Notificaciones por Perfil**

#### **Cliente (`client`)**
- `appointment` - Citas y reservas
- `payment` - Pagos y transacciones
- `rating` - Calificaciones y reseñas
- `message` - Mensajes de chat
- `booking` - Reservas y cancelaciones
- `promotion` - Promociones y ofertas

#### **Proveedor (`provider`)**
- `appointment` - Citas y reservas
- `payment` - Pagos y transacciones
- `rating` - Calificaciones y reseñas
- `message` - Mensajes de chat
- `booking` - Reservas y cancelaciones
- `availability` - Cambios de disponibilidad
- `income` - Ingresos y reportes
- `service` - Servicios y actualizaciones
- `verification` - Verificaciones de perfil

#### **Administrador (`admin`)**
- `system` - Notificaciones del sistema
- `security` - Alertas de seguridad
- `support` - Soporte y ayuda

### **Prioridades y Estados**
- **Prioridades**: `low`, `medium`, `high`, `urgent`
- **Estados**: `unread`, `read`, `archived`, `deleted`
- **Acciones**: `view`, `accept`, `decline`, `reschedule`, etc.

### **Integración en Topbar**
```html
<ui-notification-container
  *ngIf="config.showNotifications"
  [userProfile]="config.userProfile || 'client'"
  (notificationClick)="onNotificationAction($event)">
</ui-notification-container>
```

### **Uso del Servicio**
```typescript
// Configurar perfil
this.notificationService.setUserProfile('provider');

// Crear notificación
this.notificationService.createNotification({
  type: 'appointment',
  profile: 'provider',
  title: 'Nueva cita programada',
  message: 'Tienes una nueva cita con <strong>María González</strong>',
  priority: 'high',
  actions: ['view', 'reschedule']
});
```

### **Características Avanzadas**
- ✅ **Gestión por perfil** de usuario
- ✅ **Filtros y búsqueda** de notificaciones
- ✅ **Estadísticas** y métricas
- ✅ **Animaciones** suaves con Angular Animations
- ✅ **Responsive design** para móvil y desktop
- ✅ **Configuración granular** por usuario
- ✅ **Eventos del sistema** para tracking

## 🔗 **Navegación Inteligente**

### **Botones "Ver Reporte Completo"**
Los componentes de ingresos (`InicioIngresosMesComponent` e `InicioIngresosDiaComponent`) incluyen navegación inteligente que:

- **Detecta automáticamente** el tipo de reporte (mensual/diario)
- **Navega a `/dash/ingresos`** con parámetros de consulta
- **Configura automáticamente** el filtro de tiempo correspondiente
- **Mantiene el contexto** del período seleccionado

#### **Implementación**
```typescript
// En el componente de ingresos
onViewReportClick() {
  this.navigateToReport.emit({ 
    period: 'month', 
    type: 'monthly' 
  });
}

// En el componente padre (home)
onNavigateToReport(navigationData: {period: string, type: string}) {
  this.router.navigate(['/dash/ingresos'], {
    queryParams: {
      period: navigationData.period,
      type: navigationData.type
    }
  });
}

// En el componente de ingresos (ingresos.component.ts)
ngOnInit() {
  this.route.queryParams.subscribe(params => {
    if (params['period']) {
      this.selectedTimeFilter = params['period'];
    }
  });
}
```

## 🧩 **Componentes Reutilizables**

### **Componentes Base**
- **UiInputComponent** - Input con validación y estilos
- **UiButtonComponent** - Botones con loading y variantes
- **UiCalendarComponent** - Calendario para citas
- **IconComponent** - Sistema de iconos SVG
- **ThemeSwitchComponent** - Switch de tema claro/oscuro
- **TimeFilterComponent** - Filtro de tiempo con iconos elegantes

### **Componentes de Dashboard**
- **TopbarComponent** - Barra superior con búsqueda y acciones
- **PlanUpgradeAlertComponent** - Alertas de planes de suscripción
- **InicioHeaderComponent** - Header del dashboard con estado online/offline
- **InicioIngresosMesComponent** - Ingresos mensuales con navegación inteligente
- **InicioIngresosDiaComponent** - Ingresos diarios con navegación inteligente
- **InicioSolicitudesComponent** - Lista de solicitudes pendientes
- **InicioProximaCitaComponent** - Próxima cita programada

### **Componentes de Perfil**
- **ProgressPerfilComponent** - Barra de progreso del perfil
- **InfoBasicaComponent** - Información básica del trabajador
- **SeccionFotosComponent** - Upload de fotos de perfil y portada
- **SobreMiComponent** - Descripción personal
- **MisServiciosComponent** - Lista de servicios ofrecidos
- **PortafolioComponent** - Galería de trabajos con videos
- **UbicacionDisponibilidadComponent** - Ubicación y horarios
- **VerificacionPerfilComponent** - Sistema de verificación

### **Componentes de Agenda**
- **CalendarMensualComponent** - Vista mensual del calendario
- **DashboardGraficoComponent** - Gráficos de estadísticas
- **DashboardResumenComponent** - Resumen de citas
- **DayDetailComponent** - Detalle de día específico
- **HorariosConfigComponent** - Configuración de horarios
- **SidebarAgendaComponent** - Sidebar de navegación

### **Componentes de Cliente**
- **ProfileHeroComponent** - Hero del perfil de trabajador
- **BookingPanelComponent** - Panel de reservas
- **TrustStatsComponent** - Estadísticas de confianza
- **ReviewsComponent** - Sistema de reseñas
- **PortfolioComponent** - Portafolio de trabajos
- **FaqComponent** - Preguntas frecuentes

### **Componentes de Favoritos**
- **HeroSectionComponent** - Sección hero con búsqueda de servicios
- **CategoriesSectionComponent** - Grid de categorías populares
- **ProfessionalCardComponent** - Tarjeta individual de profesional
- **FavoritesSectionComponent** - Lista de profesionales favoritos
- **RecommendedSectionComponent** - Sección de recomendados

### **Componentes de Métodos de Pago**
- **PaymentMethodsHeaderComponent** - Encabezado de la sección de pagos
- **SavedCardsSectionComponent** - Lista de tarjetas guardadas con gradientes por tipo
- **BalanceCardComponent** - Tarjeta de saldo con estados dinámicos (positivo, negativo, cero)
- **TransactionsTableComponent** - Tabla de historial de transacciones con badges
- **AddCardModalComponent** - Modal para añadir nueva tarjeta con validación

### **Componentes de Reservas**
### **Componentes de Servicios (Proveedor)**
- **ServicesHeaderComponent** - Encabezado con CTA para añadir
- **ServicesListComponent** - Lista con loader y estado vacío
- **ServiceCardComponent** - Tarjeta con badges, precio, duración, acciones
- **ServiceFormComponent** - Formulario con categorías, tipo "Otro" y validación
- **ConfirmationModalComponent** - Confirmación para eliminar
- **FeedbackToastComponent** - Notificaciones de feedback

#### Ejemplo de uso en `/dash/servicios`
```html
<ui-services-header (addService)="onAddService()"></ui-services-header>
<ui-services-list
  [services]="services"
  [loading]="loading"
  (serviceEdited)="onServiceEdited($event)"
  (serviceDeleted)="onServiceDeleted($event)"
  (addService)="onAddService()">
</ui-services-list>

<ui-service-form
  *ngIf="currentView === 'form'"
  [service]="editingService"
  [categories]="categories"
  (serviceSaved)="onServiceSaved($event)"
  (formCancelled)="onFormCancelled()">
</ui-service-form>
```

### **Componentes de Estadísticas (Proveedor)**
- **StatisticsHeaderComponent** - Encabezado con título y subtítulo
- **DateFilterComponent** - Filtro de períodos con dropdown y botón aplicar
- **KpiCardsComponent** - Tarjetas de KPIs con colores específicos y tendencias
- **RevenueChartComponent** - Gráfico de líneas para evolución de ingresos y citas
- **ServicesChartComponent** - Gráfico de dona para servicios más populares
- **ReviewsTableComponent** - Tabla de reseñas recientes con estrellas

#### Ejemplo de uso en `/dash/estadisticas`
```html
<ui-statistics-header></ui-statistics-header>
<ui-date-filter 
  [range]="dateRange" 
  (rangeChange)="onDateRangeChange($event)">
</ui-date-filter>
<ui-kpi-cards></ui-kpi-cards>

<div class="charts-grid">
  <ui-revenue-chart></ui-revenue-chart>
  <ui-services-chart></ui-services-chart>
</div>

<ui-reviews-table></ui-reviews-table>
```

- **ReservasTabsComponent** - Pestañas de reservas
- **ProximaCitaCardComponent** - Tarjeta de próxima cita
- **PendienteCardComponent** - Tarjeta de cita pendiente
- **ReservaPasadaCardComponent** - Tarjeta de reserva completada
- **CanceladaClienteCardComponent** - Tarjeta de cancelación por cliente
- **CanceladaProfesionalCardComponent** - Tarjeta de cancelación por profesional

### **Sistema de Modales**
- **ReviewModalComponent** - Modal para calificar servicios
  - Sistema de estrellas interactivo (1-5)
  - Comentarios opcionales
  - Vista de éxito
  - Validación de calificación requerida
  - Hover effects y animaciones

### **Sistema de Chat**
- **ChatContainerComponent** - Contenedor principal del chat
- **ChatItemComponent** - Elemento individual de conversación
- **MessageBubbleComponent** - Burbuja de mensaje
  - Soporte para mensajes enviados/recibidos
  - Timestamps y estados de mensaje
  - Diseño responsive para móviles
  - Navegación entre conversaciones

### **Ejemplos de Uso**

#### **TopbarComponent**
```html
<app-topbar 
  [config]="topbarConfig"
  (hamburgerClick)="toggleSidebar()"
  (helpClick)="showHelp($event)"
  (notificationClick)="showNotifications()"
  (settingsClick)="showSettings()">
</app-topbar>
```

#### **ReviewModalComponent**
```html
<app-review-modal
  [isOpen]="showReviewModal"
  [workerName]="'Javier Núñez'"
  [serviceName]="'Soporte Técnico'"
  [appointmentId]="'123'"
  (close)="closeReviewModal()"
  (reviewSubmitted)="handleReview($event)">
</app-review-modal>
```

#### **InfoBasicaComponent**
```html
<app-info-basica
  [data]="workerInfo"
  [saving]="savingProfile"
  (save)="saveBasicInfo($event)">
</app-info-basica>
```

#### **SavedCardsSectionComponent**
```html
<ui-saved-cards-section
  [cards]="cards"
  (cardDeleted)="onCardDeleted($event)"
  (cardSetPrimary)="onCardSetPrimary($event)"
  (addCard)="onAddCard()">
</ui-saved-cards-section>
```

#### **BalanceCardComponent**
```html
<ui-balance-card
  [balance]="balance"
  [status]="balanceStatus"
  (liquidationRequested)="onLiquidationRequested()"
  (withdrawalRequested)="onWithdrawalRequested()">
</ui-balance-card>
```

#### **AddCardModalComponent**
```html
<ui-add-card-modal
  [isOpen]="showAddCardModal"
  (close)="onCloseModal()"
  (cardAdded)="onCardAdded($event)">
</ui-add-card-modal>
```

## 🎯 **Sistema de Navegación**

### **TopbarComponent**
Barra superior reutilizable con funcionalidades contextuales:

- **Búsqueda de Ayuda** - Input readonly que abre modal de ayuda contextual
- **Menú Hamburger** - Para colapsar sidebar en móviles
- **Notificaciones** - Sistema de notificaciones
- **Configuración** - Acceso rápido a configuraciones

### **Ayuda Contextual**
Sistema inteligente que proporciona ayuda específica según el contexto:

- **Dashboard** - Ayuda general del dashboard
- **Perfil** - Configuración de perfil y servicios
- **Agenda** - Gestión de citas y horarios
- **Cliente** - Navegación y funcionalidades para clientes

### **Rutas Dinámicas**
- **Perfil de Trabajador**: `/client/explorar/:workerId`
- **Chat con Profesional**: `/client/conversaciones`
- **Favoritos**: `/client/favoritos`
- **Métodos de Pago**: `/client/pagos`
- **Perfil de Cliente**: `/client/perfil`
- **Estadísticas de Proveedor**: `/dash/estadisticas`
- **Gestión de Servicios**: `/dash/servicios`
- **Promociones**: `/dash/promocion`
- **Mensajes del Proveedor**: `/dash/mensajes`
- **Navegación contextual** basada en el rol del usuario

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Características Móviles**
- Sidebar colapsible con hamburger menu
- Topbar adaptativo con búsqueda contextual
- Navegación táctil optimizada
- Componentes adaptativos
- Alertas responsivas
- Modales responsive con z-index optimizado

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

## 🎨 **Sistema de Diseño**

### **Estilo Frameblox**
Aplicado a componentes clave para una experiencia visual moderna:

- **Gradientes** - Colores suaves y modernos
- **Backdrop Blur** - Efectos de vidrio esmerilado
- **Sombras** - Profundidad y elevación
- **Bordes Redondeados** - Diseño suave y amigable
- **Animaciones** - Transiciones fluidas

### **Componentes con Estilo Frameblox**
- **ProfileHeroComponent** - Hero section con gradientes
- **BookingPanelComponent** - Panel de reservas estilizado
- **ReviewModalComponent** - Modal con efectos modernos
- **PerfilTrabajadorComponent** - Página completa estilizada
- **FavoritosComponent** - Página de favoritos con glassmorphism
- **HeroSectionComponent** - Hero con gradientes y backdrop-blur
- **CategoriesSectionComponent** - Tarjetas con efectos de profundidad
- **ProfessionalCardComponent** - Tarjetas con transparencias
- **FavoritesSectionComponent** - Lista con glassmorphism
- **PaymentMethodsHeaderComponent** - Encabezado con texto gradiente
- **SavedCardsSectionComponent** - Tarjetas con gradientes por tipo (Visa, Mastercard, Amex)
- **BalanceCardComponent** - Tarjeta de saldo con estados dinámicos
- **TransactionsTableComponent** - Tabla con glassmorphism y badges
- **AddCardModalComponent** - Modal con backdrop-blur y validación
- **PagosComponent** - Página completa con estilo Frameblox
- **StatisticsHeaderComponent** - Encabezado con tipografía moderna
- **DateFilterComponent** - Filtro con botón púrpura y layout horizontal
- **KpiCardsComponent** - Tarjetas con colores específicos y iconos SVG
- **RevenueChartComponent** - Gráfico con Chart.js y diseño moderno
- **ServicesChartComponent** - Gráfico de dona con colores vibrantes
- **ReviewsTableComponent** - Tabla con estrellas y hover effects
- **EstadisticasComponent** - Página completa con layout perfecto

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

### **Testing de Modales**
```typescript
// Ejemplo de test para modal de reseñas
describe('ReviewModalComponent', () => {
  it('should emit review data when submitted', () => {
    component.rating = 5;
    component.comment = 'Excelente servicio';
    component.onSubmit();
    expect(component.reviewSubmitted.emit).toHaveBeenCalledWith({
      rating: 5,
      comment: 'Excelente servicio',
      workerName: 'Javier Núñez',
      serviceName: 'Soporte Técnico'
    });
  });
});
```

## 🔧 **Desarrollo**

### **Agregar Nuevos Componentes**
1. Crear en `src/libs/shared-ui/`
2. Implementar con `@Component` standalone
3. Exportar en `index.ts`
4. Documentar props y eventos
5. Agregar tests unitarios

### **Agregar Nuevas Páginas**
1. Crear en `src/app/` correspondiente
2. Configurar ruta en `app.routes.ts`
3. Implementar navegación
4. Agregar al menú correspondiente
5. Integrar con TopbarComponent

### **Migración de Componentes**
1. **Identificar** componentes HTML/CSS en `templates/componentes/`
2. **Crear** componente Angular en `src/libs/shared-ui/`
3. **Migrar** HTML manteniendo estructura
4. **Adaptar** estilos SCSS con variables CSS
5. **Implementar** lógica TypeScript
6. **Integrar** en páginas correspondientes
7. **Probar** funcionalidad completa

### **Sistema de Modales**
Para crear nuevos modales siguiendo el patrón establecido:

1. **Crear** componente en `src/libs/shared-ui/[nombre]-modal/`
2. **Implementar** interfaz base con `@Input()` y `@Output()`
3. **Aplicar** estilos consistentes con z-index apropiado
4. **Agregar** animaciones de entrada/salida
5. **Implementar** validaciones necesarias
6. **Documentar** props y eventos

### **Estilos y Temas**
- Usar variables CSS para colores
- Implementar soporte para tema oscuro
- Seguir patrones de diseño existentes
- Mantener consistencia visual
- Aplicar estilo Frameblox cuando sea apropiado
- Usar gradientes y backdrop-blur para efectos modernos

## 📊 **Performance**

### **Optimizaciones Implementadas**
- **Lazy Loading** para rutas
- **OnPush** change detection
- **TrackBy** functions para listas
- **Image optimization**
- **Bundle splitting**
- **Componentes standalone** para mejor tree-shaking
- **Modales con z-index optimizado**
- **Chart.js con SSR compatibility**

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

## 📜 **Sistema Legal Completo**

### **Términos y Condiciones**
Página legal completa ubicada en `/client/terminos` y `/dash/terminos` con:

#### **23 Secciones Principales:**
1. **Definiciones** (7 términos: Plataforma, Profesional, Cliente, Servicios, Cuenta, PSP, Contenido)
2. **Naturaleza y alcance** (intermediación - NO presta, NO supervisa, NO garantiza)
3. **Elegibilidad y registro** (18+, KYC, documentos tributarios)
4. **Verificación, reputación y moderación** (ratings orientativos, moderación de contenido)
5. **Obligaciones del Cliente** (información correcta, pagar, no actividades ilegales)
6. **Planes y comisiones** (15%, renovación automática, 15 días aviso cambios)
7. **Pagos y tributación Chile** (PSP, 3-5 días, SII, IVA, chargebacks)
8. **Cancelaciones y reembolsos** (+24h sin penalización, -24h con cargo)
9. **Obligaciones del Profesional** (legalidad, calidad, transparencia, no sustitución)
10. **Contratistas independientes** (comercial NO laboral, sin beneficios, sin subordinación)
11. **Seguros** (responsabilidad civil obligatoria)
12. **Uso aceptable y prohibiciones** (7 prohibiciones)
13. **Propiedad intelectual** (licencia no exclusiva sobre Contenido)
14. **Datos personales** (Ley 19.628, comunicaciones, permisos dispositivo)
15. **Medidas de seguridad** (alertas, limitación, retención, suspensión)
16. **Disputas Cliente-Profesional** (mediación interna, SERNAC)
17. **Garantías y limitación** ("tal cual", UF 50 o comisiones 6 meses)
18. **Indemnidad** (defender, indemnizar, honorarios legales)
19. **Fuerza mayor** (eventos fuera de control)
20. **Cambios a Términos** (15 días aviso previo)
21. **Terminación** (cláusulas que subsisten)
22. **Ley aplicable** (Ley 19.496 consumidores, SERNAC, tribunales Santiago)
23. **Diversos** (cesión, notificaciones, acuerdo íntegro, idioma español Chile)

#### **Anexo A: Conductas Prohibidas**
7 prohibiciones detalladas (suplantación, fraude, malware, discriminación, etc.)

### **Política de Privacidad**
Política completa conforme a **Ley N°19.628** ubicada en `/client/terminos` y `/dash/terminos`:

#### **15 Secciones Principales:**
1. **Responsable del Tratamiento** (encargado de privacidad)
2. **Datos que Tratamos** (5 subsecciones detalladas):
   - 2.1 Registro y perfil (RUT, email, teléfono, avatar, servicios)
   - 2.2 Verificación KYC (cédula, selfie, inicio actividades)
   - 2.3 Operación (reservas, chat, soporte, boletas)
   - 2.4 Técnicos (IP, logs, IDFA/AAID, geolocalización)
   - 2.5 Marketing (cookies, SDKs, UTM, campañas)
3. **Finalidades y Bases de Licitud** (tabla con 10 finalidades y bases legales)
4. **Cookies y SDKs** (esenciales, funcionales, analíticas, marketing opt-in)
5. **Fuentes y Destinatarios** (Azure, PSP, KYC, Analytics, Email/SMS, Helpdesk, ERP)
6. **Transferencias Internacionales** (cláusulas contractuales, protección adecuada)
7. **Plazos de Conservación** (tabla detallada con 6 categorías):
   - KYC: 90 días (2 años si fraude)
   - Transacciones: 6 años (tributario SII)
   - Cuenta: 2 años tras cierre
   - Logs: 6-12 meses
   - Marketing: hasta revocación
8. **Seguridad** (TLS, MFA, auditorías, notificación de incidentes)
9. **Menores de Edad** (prohibido < 18 años)
10. **Decisiones Automatizadas y Perfilado** (matching, fraude, NO efectos jurídicos)
11. **Derechos ARCO** (Acceso, Rectificación, Cancelación, Oposición, Portabilidad):
    - Plazo respuesta: 15 días hábiles
    - Contacto: privacy@adomiapp.com con asunto "Derechos de Datos"
12. **Marketing y Preferencias** (opt-in, dar de baja, transaccionales no afectadas)
13. **Terceros y Enlaces** (responsabilidad limitada)
14. **Cambios a la Política** (15 días aviso previo, historial de versiones)
15. **Reclamos y Resolución** (Ley 19.628, SERNAC, vías judiciales Chile)

#### **3 Anexos Detallados:**
- **Anexo A:** Tabla de Terceros (7 proveedores con ubicaciones)
- **Anexo B:** Política de Cookies y SDKs (esenciales, analíticas, marketing)
- **Anexo C:** Retención y Eliminación (eliminación segura, anonimización)

### **Características del Sistema Legal:**
- ✅ **Tablas interactivas** con hover effects
- ✅ **Diseño responsivo** para móvil y desktop
- ✅ **Descarga PDF** integrada
- ✅ **Tabs de navegación** entre Términos y Privacidad
- ✅ **Gradientes morados** en headers de tablas
- ✅ **Subsecciones** con borde lateral
- ✅ **Badges de verificación** (✓) en listas
- ✅ **Footer informativo** con aceptación implícita

## 🔍 **Sistema de Búsqueda Global**

### **Búsqueda Contextual**
Sistema inteligente de búsqueda y ayuda integrado en el topbar:

#### **Componentes:**
- **GlobalSearchModalComponent** - Modal centrado con búsqueda en tiempo real
- **SearchSuggestionItemComponent** - Items de sugerencias con iconos y categorías
- **GlobalSearchService** - Lógica de búsqueda con relevancia y contexto
- **SearchSuggestionModel** - Modelos tipados para sugerencias

#### **Características:**
- ✅ **Búsqueda en tiempo real** con debounce
- ✅ **Sugerencias contextuales** según la página actual
- ✅ **Relevancia inteligente** basada en título, descripción, keywords y prioridad
- ✅ **Historial de búsquedas** almacenado en localStorage
- ✅ **Categorización** por tipo (ayuda, acción, página, configuración)
- ✅ **Navegación automática** al seleccionar sugerencia
- ✅ **Animaciones suaves** de entrada/salida
- ✅ **Diseño minimalista** con estilos limpios

#### **Categorías de Sugerencias:**
- `help` - Ayuda y soporte
- `action` - Acciones rápidas
- `page` - Navegación a páginas
- `setting` - Configuraciones

#### **Integración:**
```typescript
// En TopbarComponent
<button (click)="onHelpClick()">¿Necesitas ayuda?</button>

// Modal se abre automáticamente
<ui-global-search-modal 
  [isOpen]="isSearchModalOpen"
  (close)="onSearchModalClose()"
  (suggestionClick)="onSearchSuggestionClick($event)">
</ui-global-search-modal>
```

## 📅 **Sistema de Agenda Avanzado**

### **Modal de Nueva Cita**
Modal completo para agendar citas ubicado en `shared-ui/calendar-mensual/modal-agendar-cita`:

#### **Características:**
- ✅ **Reactive Forms** con validaciones
- ✅ **Selector de cliente** con búsqueda
- ✅ **Selector de fecha** con calendario
- ✅ **Horario inicio/fin** con validación de solapamiento
- ✅ **Selector de color** para categorización visual
- ✅ **Campo de notas** opcional
- ✅ **Animaciones** de entrada/salida (fadeInOut, scaleInOut)
- ✅ **Responsive** para móvil y desktop
- ✅ **Box-sizing** optimizado para evitar overflow

#### **Integración:**
- Botón "Nueva Cita" en `CalendarMensualComponent`
- Click en día del calendario pre-selecciona fecha
- Botón "+ Nueva Cita" en `DayDetailComponent`

### **Modales de Gestión de Reservas**
Sistema completo de modales para solicitudes de reserva en `/dash/home`:

#### **AcceptReservaModalComponent:**
- **Confirmación visual** con icono de check verde
- **Información del cliente** (nombre, servicio, fecha, hora)
- **Botón de confirmación** con loading state
- **Mensaje de éxito** ("Estamos agendando tu cita..." → "¡Cita agendada!")
- **Animaciones suaves** de transición

#### **RejectReservaModalComponent:**
- **Confirmación de rechazo** con icono de X rojo
- **Campo de motivo** opcional pero recomendado
- **Botones de confirmación/cancelación** claramente diferenciados
- **Loading state** durante el proceso

#### **DetallesCitaModalComponent:**
- **Vista completa** de información de cita
- **Foto y nombre** del cliente
- **Servicio, fecha, hora y duración**
- **Precio y estado** de la cita
- **Notas adicionales** si existen
- **Botón de contacto** para mensajería
- **Diseño elegante** con glassmorphism

#### **Integración en Dashboard:**
```typescript
// En InicioSolicitudesComponent
<button (click)="openAcceptModal(solicitud)">Aceptar</button>
<button (click)="openRejectModal(solicitud)">Rechazar</button>

// En InicioProximaCitaComponent
<button (click)="openDetailsModal()">Ver Detalles</button>
```

### **Búsqueda de Ubicación (Chile)**
Sistema completo de búsqueda geográfica en `SearchInputComponent`:

#### **Características:**
- ✅ **Todas las regiones de Chile** (16 regiones)
- ✅ **Todas las comunas** organizadas por región
- ✅ **Búsqueda directa** por nombre de comuna
- ✅ **Selector de región + comuna** con dropdowns
- ✅ **Botón "Usar mi ubicación actual"** (placeholder)
- ✅ **Filtrado en tiempo real** con búsqueda
- ✅ **Formato "Comuna, Región"** en resultados
- ✅ **Box-sizing optimizado** para evitar overflow

#### **Regiones Incluidas:**
- Arica y Parinacota, Tarapacá, Antofagasta
- Atacama, Coquimbo, Valparaíso
- Metropolitana, O'Higgins, Maule
- Ñuble, Biobío, Araucanía
- Los Ríos, Los Lagos, Aysén
- Magallanes

## ⏱️ **Filtro de Tiempo Elegante**

### **TimeFilterComponent**
Filtro de períodos temporales ubicado en `shared-ui/time-filter`:

#### **Características:**
- ✅ **6 períodos predefinidos**: Día, Semana, Mes, Trimestre, Año, Personalizado
- ✅ **Iconos elegantes** específicos por período:
  - Día: `clock` (reloj)
  - Semana: `calendar` (calendario)
  - Mes: `calendar` (calendario)
  - Trimestre: `chart` (gráfico)
  - Año: `chart` (gráfico)
  - Personalizado: `filter` (filtro)
- ✅ **Selector de rango** personalizado con fecha inicio/fin
- ✅ **Botón "Aplicar"** para filtros personalizados
- ✅ **Emisión de eventos** con fechas calculadas
- ✅ **Diseño moderno** con gradientes y hover effects
- ✅ **Responsive** para móvil

#### **Integración:**
```typescript
// En cualquier página
<app-time-filter (filterChange)="onFilterChange($event)"></app-time-filter>

// Recibir rango de fechas
onFilterChange(range: { startDate: Date, endDate: Date, type: string }) {
  console.log('Filtrar datos desde', range.startDate, 'hasta', range.endDate);
}
```

#### **Navegación desde Dashboard:**
Enlaces en `InicioIngresosMesComponent` e `InicioIngresosDiaComponent` que navegan a `/dash/ingresos` con el filtro automáticamente seleccionado (mes o día).

## ⚙️ **Topbar Configuración**

### **Botón de Configuración del Cliente**
El icono de configuración (⚙️) en el topbar del cliente ahora navega correctamente:

#### **Comportamiento:**
- **Cliente:** `/client/configuracion` ✅
- **Trabajador:** `/dash/perfil?tab=configuracion` ✅

#### **Características:**
- ✅ **Navegación automática** al hacer click
- ✅ **Cierre de menú** en móvil
- ✅ **Contexto apropiado** según perfil de usuario

## 📝 **Changelog**

### **v2.5.0 - Sistema Legal y Búsqueda Global**
- ✅ **Términos y Condiciones completos** - 23 secciones + 1 anexo con Ley 19.496 Chile
- ✅ **Política de Privacidad completa** - 15 secciones + 3 anexos con Ley 19.628 Chile
- ✅ **Sistema de búsqueda global** - Modal contextual con sugerencias inteligentes
- ✅ **Modales de agenda** - Nueva Cita, Aceptar/Rechazar Reserva, Detalles de Cita
- ✅ **Búsqueda de ubicación Chile** - 16 regiones y todas las comunas
- ✅ **Filtro de tiempo elegante** - 6 períodos con iconos específicos
- ✅ **Topbar configuración** - Navegación correcta para cliente y trabajador
- ✅ **Tablas legales** con gradientes y hover effects
- ✅ **Descarga PDF** integrada en páginas legales
- ✅ **GlobalSearchService** con relevancia y contexto
- ✅ **TimeFilterComponent** con selector de rango personalizado
- ✅ **Reactive Forms** en modal de agendar cita
- ✅ **Box-sizing optimizado** en todos los nuevos componentes
- ✅ **Animaciones suaves** (fadeInOut, scaleInOut) en modales

### **v2.4.0 - Migración de Estadísticas**
- ✅ **Migración completa de estadísticas** - Componentes HTML/CSS a Angular standalone
- ✅ **StatisticsHeaderComponent** - Encabezado con tipografía exacta de referencia
- ✅ **DateFilterComponent** - Filtro de períodos con dropdown y botón púrpura
- ✅ **KpiCardsComponent** - Tarjetas con colores específicos y grid responsive
- ✅ **RevenueChartComponent** - Gráfico de líneas con Chart.js y SSR guards
- ✅ **ServicesChartComponent** - Gráfico de dona para servicios populares
- ✅ **ReviewsTableComponent** - Tabla de reseñas con estrellas y datos realistas
- ✅ **Clase base metric-card** - Estilo común para todas las tarjetas de métricas
- ✅ **Layout perfecto** - Coincide exactamente con imagen de referencia
- ✅ **Integración completa** en `/dash/estadisticas` con datos hardcodeados
- ✅ **Interfaces TypeScript** para ReviewItem, ChartSeries, KpiItem

### **v2.3.0 - Gestión de Servicios (Proveedor)**
- ✅ Migración de componentes de servicios desde templates a Angular standalone
- ✅ Nuevos componentes en `shared-ui/services`: header, list, card, form, confirmation-modal, feedback-toast
- ✅ Integración completa en `/dash/servicios` con CRUD en memoria
- ✅ Estilo Frameblox: gradientes, blur, sombras, transiciones
- ✅ Iconos ampliados en `IconComponent` (plus, edit, trash, save, clipboard, check/x-circle)
- ✅ Tipos e interfaces: `Service`, `ServiceCategory`, `ServiceFormData`, `ToastType`

### **v2.2.0 - Migración de Métodos de Pago**
- ✅ **Migración de métodos de pago** - Componentes HTML/CSS a Angular
- ✅ **PaymentMethodsHeaderComponent** con texto gradiente
- ✅ **SavedCardsSectionComponent** con gradientes por tipo de tarjeta:
  * Visa: gradiente gris oscuro
  * Mastercard: gradiente naranja
  * Amex: gradiente azul eléctrico
- ✅ **BalanceCardComponent** con estados dinámicos:
  * Positivo: gradiente verde con botón de retiro
  * Negativo: gradiente rojo con botón de liquidación
  * Cero: gradiente amarillo sin acciones
- ✅ **TransactionsTableComponent** con badges de método de pago
- ✅ **AddCardModalComponent** con validación y aviso de seguridad
- ✅ **Estilos reales de explorar** aplicados a métodos de pago
- ✅ **Ruta de pagos** `/client/pagos`
- ✅ **Interfaces TypeScript** para Card, Transaction, CardFormData
- ✅ **Formateo automático** de campos de tarjeta
- ✅ **Gestión de estado** completa para tarjetas y saldo

### **v2.1.0 - Migración de Favoritos y Chat**
- ✅ **Migración de favoritos** - Componentes HTML/CSS a Angular
- ✅ **Sistema de chat** completo con ChatContainerComponent
- ✅ **Componentes de favoritos** con estilo Frameblox:
  * HeroSectionComponent con glassmorphism
  * CategoriesSectionComponent con gradientes
  * ProfessionalCardComponent con transparencias
  * FavoritesSectionComponent con backdrop-blur
  * RecommendedSectionComponent con texto gradiente
- ✅ **Estilos reales de explorar** aplicados a favoritos
- ✅ **Rutas de chat** `/client/conversaciones`
- ✅ **Rutas de favoritos** `/client/favoritos`
- ✅ **Navegación móvil** mejorada para chat
- ✅ **MenuService** para control global de sidebar

### **v2.0.0 - Migración Completa de Componentes**
- ✅ **Migración completa** de componentes HTML/CSS a Angular
- ✅ **Sistema de modales** reutilizable con ReviewModalComponent
- ✅ **TopbarComponent** con ayuda contextual
- ✅ **Sistema de estrellas** interactivo para calificaciones
- ✅ **Estilo Frameblox** aplicado a componentes clave
- ✅ **Rutas dinámicas** para perfiles de trabajadores
- ✅ **Componentes de dashboard** completos
- ✅ **Sistema de reservas** con modales integrados
- ✅ **Responsive design** mejorado
- ✅ **Z-index optimizado** para modales

### **v1.0.0 - Versión Base**
- ✅ **Angular 20** con SSR
- ✅ **Sistema de autenticación** completo
- ✅ **Dashboards diferenciados** por rol
- ✅ **Sistema de temas** claro/oscuro
- ✅ **Componentes base** reutilizables
- ✅ **Integración con Stripe** para pagos

## 📞 **Soporte**

Para soporte técnico o consultas:
- **Email**: frontend@adomiapp.cl
- **Documentación**: Este README
- **Issues**: GitHub Issues

---

**¡Adomi Frontend - Experiencia de usuario excepcional! 🎨**