# 🔔 Sistema de Notificaciones - Adomi App

## 📋 **Resumen**

Sistema completo de notificaciones migrado desde `adomi-app/templates/componentes/notificaciones` a Angular components en `shared-ui`. Diseñado para manejar múltiples perfiles de usuario (cliente, proveedor, admin) con diferentes tipos de notificaciones y funcionalidades avanzadas.

## 🏗️ **Arquitectura del Sistema**

### **📁 Estructura de Archivos**
```
notifications/
├── models/
│   └── notification.model.ts          # Interfaces y tipos
├── services/
│   └── notification.service.ts        # Servicio centralizado
├── notification-bell/
│   ├── notification-bell.component.ts
│   ├── notification-bell.component.html
│   └── notification-bell.component.scss
├── notification-panel/
│   ├── notification-panel.component.ts
│   ├── notification-panel.component.html
│   └── notification-panel.component.scss
├── notification-container/
│   ├── notification-container.component.ts
│   ├── notification-container.component.html
│   └── notification-container.component.scss
├── index.ts                           # Exports
└── README.md                          # Esta documentación
```

## 🎯 **Tipos de Notificaciones**

### **👤 Por Perfil de Usuario**

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

### **⚡ Prioridades**
- `low` - Baja prioridad (gris)
- `medium` - Prioridad media (amarillo)
- `high` - Alta prioridad (rojo)
- `urgent` - Urgente (rojo intenso)

### **📊 Estados**
- `unread` - No leída
- `read` - Leída
- `archived` - Archivada
- `deleted` - Eliminada

## 🔧 **Componentes**

### **1. NotificationBellComponent**
- **Propósito**: Botón/campana de notificaciones
- **Funcionalidades**:
  - Muestra contador de notificaciones no leídas
  - Badge animado para notificaciones nuevas
  - Emite eventos de toggle

### **2. NotificationPanelComponent**
- **Propósito**: Panel desplegable con lista de notificaciones
- **Funcionalidades**:
  - Lista de notificaciones no leídas y leídas
  - Marcar como leída individual o todas
  - Animaciones de entrada/salida
  - Estado vacío
  - Enlace a página completa

### **3. NotificationContainerComponent**
- **Propósito**: Contenedor principal que orquesta bell + panel
- **Funcionalidades**:
  - Manejo de estado abierto/cerrado
  - Click fuera para cerrar
  - Navegación automática
  - Integración con Router

## 🛠️ **Servicio de Notificaciones**

### **NotificationService**
- **Gestión centralizada** de notificaciones
- **Configuración por perfil** de usuario
- **CRUD completo** (crear, leer, actualizar, eliminar)
- **Filtros y búsqueda**
- **Estadísticas** de notificaciones
- **Eventos** del sistema

### **Métodos Principales**
```typescript
// Configuración
setUserProfile(profile: UserProfile): void
getCurrentProfile(): UserProfile

// Gestión
createNotification(template: NotificationTemplate): Notification
markAsRead(notificationId: string): void
markAllAsRead(): void
archiveNotification(notificationId: string): void
deleteNotification(notificationId: string): void

// Consultas
getNotifications(filters?: NotificationFilters): Observable<Notification[]>
getUnreadCount(): Observable<number>
getStats(): Observable<NotificationStats>
```

## 🎨 **Integración en Topbar**

### **Configuración**
```typescript
// En dash-layout.component.ts
topbarConfig: TopbarConfig = {
  showNotifications: true,
  userProfile: 'provider'  // 'client' | 'provider' | 'admin'
};
```

### **HTML del Topbar**
```html
<ui-notification-container
  *ngIf="config.showNotifications"
  [userProfile]="config.userProfile || 'client'"
  (notificationClick)="onNotificationAction($event)">
</ui-notification-container>
```

## 📱 **Responsive Design**

- **Desktop**: Panel desplegable a la derecha
- **Mobile**: Panel de ancho completo con márgenes
- **Animaciones**: Suaves transiciones de entrada/salida
- **Touch-friendly**: Botones y áreas de toque optimizadas

## 🎯 **Plan de Implementación Futuro**

### **Fase 1: Notificaciones Básicas** ✅
- [x] Migración de componentes
- [x] Servicio básico
- [x] Integración en topbar
- [x] Notificaciones de ejemplo

### **Fase 2: Notificaciones en Tiempo Real**
- [ ] WebSocket integration
- [ ] Push notifications
- [ ] Notificaciones push del navegador
- [ ] Sonidos y vibración

### **Fase 3: Notificaciones Avanzadas**
- [ ] Templates dinámicos
- [ ] Programación de notificaciones
- [ ] Notificaciones por email/SMS
- [ ] Configuración granular por usuario

### **Fase 4: Analytics y Optimización**
- [ ] Métricas de engagement
- [ ] A/B testing de notificaciones
- [ ] Optimización de timing
- [ ] Machine learning para personalización

## 🔗 **Uso en la Aplicación**

### **Dashboard del Proveedor**
```typescript
// Configurar perfil de proveedor
this.notificationService.setUserProfile('provider');

// Crear notificación de ejemplo
this.notificationService.createNotification({
  type: 'appointment',
  profile: 'provider',
  title: 'Nueva cita programada',
  message: 'Tienes una nueva cita con <strong>María González</strong>',
  priority: 'high',
  actions: ['view', 'reschedule']
});
```

### **Cliente**
```typescript
// Configurar perfil de cliente
this.notificationService.setUserProfile('client');

// Crear notificación de pago
this.notificationService.createNotification({
  type: 'payment',
  profile: 'client',
  title: 'Pago confirmado',
  message: 'Tu pago de <strong>$45.000</strong> ha sido procesado',
  priority: 'medium'
});
```

## 🎨 **Personalización Visual**

### **Colores por Tipo**
- `appointment`: #4f46e5 (índigo)
- `payment`: #10b981 (verde)
- `rating`: #f59e0b (ámbar)
- `system`: #6b7280 (gris)
- `message`: #3b82f6 (azul)
- `verification`: #8b5cf6 (púrpura)
- `promotion`: #ec4899 (rosa)
- `security`: #ef4444 (rojo)

### **Iconos**
- Cada tipo tiene su icono específico
- Iconos SVG escalables
- Colores consistentes con el tema

## 🚀 **Beneficios del Sistema**

1. **Escalabilidad**: Fácil agregar nuevos tipos de notificaciones
2. **Flexibilidad**: Configuración por perfil de usuario
3. **Reutilización**: Componentes modulares en shared-ui
4. **Mantenibilidad**: Código bien estructurado y documentado
5. **UX**: Experiencia de usuario consistente
6. **Performance**: Gestión eficiente de estado
7. **Accesibilidad**: Soporte para lectores de pantalla
8. **Responsive**: Funciona en todos los dispositivos

## 📝 **Notas de Desarrollo**

- **Angular 20**: Compatible con la versión actual
- **Standalone Components**: Todos los componentes son standalone
- **TypeScript**: Tipado estricto para mejor DX
- **SCSS**: Estilos modulares y mantenibles
- **RxJS**: Programación reactiva para estado
- **Animations**: Transiciones suaves con Angular Animations

---

**Estado**: ✅ **Completado** - Sistema básico implementado y funcionando
**Próximo**: Implementar notificaciones en tiempo real con WebSocket
















