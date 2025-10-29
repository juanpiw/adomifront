# Modales de Reservas Pendientes

## 📋 **Descripción**

Este directorio contiene los modales para gestionar las reservas pendientes en el componente `inicio-solicitudes`. Los modales permiten a los trabajadores aceptar o rechazar solicitudes de reserva con una interfaz intuitiva y funcional.

## 🏗️ **Arquitectura**

### **Estructura de Archivos**
```
modals/
├── interfaces.ts                    # Interfaces y tipos de datos
├── accept-reserva-modal.component.* # Modal para aceptar reservas
├── reject-reserva-modal.component.* # Modal para rechazar reservas
├── index.ts                        # Exportaciones
└── README.md                       # Documentación
```

### **Componentes**

#### **1. AcceptReservaModalComponent**
Modal para confirmar la aceptación de una reserva.

**Props:**
- `isOpen: boolean` - Estado de apertura del modal
- `reservaData: ReservaData | null` - Datos de la reserva
- `loading: boolean` - Estado de carga

**Events:**
- `close` - Cerrar modal
- `confirm` - Confirmar aceptación

#### **2. RejectReservaModalComponent**
Modal para rechazar una reserva con motivo.

**Props:**
- `isOpen: boolean` - Estado de apertura del modal
- `reservaData: ReservaData | null` - Datos de la reserva
- `loading: boolean` - Estado de carga

**Events:**
- `close` - Cerrar modal
- `confirm` - Confirmar rechazo

## 🔧 **Interfaces**

### **ReservaData**
```typescript
interface ReservaData {
  id: string;
  clientName: string;
  clientAvatar: string;
  service: string;
  when: string;
  time: string;
  date?: string;
  location?: string;
  estimatedIncome?: number;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
}
```

### **RejectionReason**
```typescript
interface RejectionReason {
  value: string;
  label: string;
  description?: string;
}
```

### **ModalResult**
```typescript
interface ModalResult {
  success: boolean;
  data?: any;
  reason?: string;
}
```

## 🎨 **Características de Diseño**

### **Modal de Aceptar**
- **Icono**: Check circle verde
- **Información**: Servicio, cliente, fecha, ubicación, ingreso estimado
- **Acciones**: Cancelar y Confirmar
- **Estados**: Loading con spinner

### **Modal de Rechazar**
- **Icono**: Exclamation triangle amarillo
- **Opciones**: Razones predefinidas + opción personalizada
- **Validación**: Requiere selección de motivo
- **Acciones**: Cancelar y Rechazar

## 🚀 **Uso**

### **En el Componente Padre**
```typescript
import { 
  InicioSolicitudesComponent,
  AcceptReservaResult,
  RejectReservaResult
} from './inicio-solicitudes';

// En el template
<app-inicio-solicitudes 
  [data]="solicitudData"
  (reservaAccepted)="onReservaAccepted($event)"
  (reservaRejected)="onReservaRejected($event)">
</app-inicio-solicitudes>

// En el componente
onReservaAccepted(result: AcceptReservaResult) {
  console.log('Reserva aceptada:', result);
  // Implementar lógica de API
}

onReservaRejected(result: RejectReservaResult) {
  console.log('Reserva rechazada:', result);
  // Implementar lógica de API
}
```

### **Uso Directo de Modales**
```typescript
import { 
  AcceptReservaModalComponent,
  RejectReservaModalComponent,
  ReservaData
} from './modals';

// En el template
<app-accept-reserva-modal
  [isOpen]="showAcceptModal"
  [reservaData]="reservaData"
  [loading]="loading"
  (close)="onAcceptModalClose()"
  (confirm)="onAcceptConfirm($event)">
</app-accept-reserva-modal>
```

## 📱 **Responsive Design**

- **Desktop**: Modales centrados con ancho máximo
- **Mobile**: Modales adaptados con padding reducido
- **Tablet**: Layout intermedio optimizado

## ♿ **Accesibilidad**

- **Navegación por teclado**: ESC para cerrar
- **Focus management**: Focus en elementos interactivos
- **Screen readers**: Labels descriptivos
- **Contraste**: Cumple estándares WCAG

## 🎯 **Razones de Rechazo Predefinidas**

1. **No tengo disponibilidad en ese horario**
2. **La ubicación está fuera de mi zona de servicio**
3. **No puedo realizar el servicio solicitado**
4. **Otro motivo** (con campo de texto libre)

## 🔄 **Estados de Loading**

- **Botones deshabilitados** durante procesamiento
- **Spinner animado** en botones de acción
- **Texto dinámico** indicando estado actual
- **Prevención de múltiples clicks**

## 🎨 **Animaciones**

- **Entrada**: Scale + fade in
- **Salida**: Scale + fade out
- **Duración**: 300ms
- **Easing**: ease

## 🧪 **Testing**

### **Casos de Prueba**
- Apertura y cierre de modales
- Validación de formularios
- Estados de loading
- Navegación por teclado
- Responsive design

### **Mocks**
```typescript
const mockReservaData: ReservaData = {
  id: '1',
  clientName: 'Marcos Reyes',
  clientAvatar: 'https://example.com/avatar.jpg',
  service: 'Maquillaje Profesional',
  when: 'Mañana',
  time: '18:00 PM',
  date: '2025-10-11',
  location: 'Av. Providencia 123, Santiago',
  estimatedIncome: 45000
};
```

## 🔧 **Configuración**

### **Variables CSS**
```scss
// Colores
$modal-overlay-bg: rgba(0, 0, 0, 0.6);
$modal-bg: white;
$modal-border-radius: 1rem;
$modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

// Animaciones
$modal-transition: 0.3s ease;
$modal-scale: 0.95;
```

### **Breakpoints**
```scss
$mobile: 640px;
$tablet: 768px;
$desktop: 1024px;
```

## 📝 **Notas de Implementación**

- **Z-index**: 50 para overlay
- **Backdrop blur**: 4px para efecto glassmorphism
- **Body scroll**: Deshabilitado cuando modal está abierto
- **Event delegation**: Para clicks en overlay
- **Memory management**: Cleanup de event listeners

## 🚀 **Próximas Mejoras**

- [ ] Animaciones más fluidas
- [ ] Soporte para múltiples reservas
- [ ] Integración con sistema de notificaciones
- [ ] Modo oscuro
- [ ] Internacionalización
- [ ] Tests E2E automatizados











