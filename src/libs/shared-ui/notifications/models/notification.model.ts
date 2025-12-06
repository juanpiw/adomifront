// Tipos de notificaciones disponibles
export type NotificationType = 
  | 'appointment'      // Citas y reservas
  | 'reminder'         // Recordatorios
  | 'payment'          // Pagos y transacciones
  | 'rating'           // Calificaciones y reseñas
  | 'system'           // Notificaciones del sistema
  | 'message'          // Mensajes de chat
  | 'verification'     // Verificaciones de perfil
  | 'promotion'        // Promociones y ofertas
  | 'security'         // Alertas de seguridad
  | 'booking'          // Reservas y cancelaciones
  | 'availability'     // Cambios de disponibilidad
  | 'income'           // Ingresos y reportes
  | 'service'          // Servicios y actualizaciones
  | 'profile'          // Actualizaciones de perfil
  | 'support';         // Soporte y ayuda

// Perfiles de usuario que pueden recibir notificaciones
export type UserProfile = 'client' | 'provider' | 'admin';

// Prioridad de la notificación
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Estado de la notificación
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'deleted';

// Acciones disponibles para notificaciones
export type NotificationAction = 
  | 'view'           // Ver detalles
  | 'accept'         // Aceptar
  | 'decline'        // Rechazar
  | 'reschedule'     // Reprogramar
  | 'contact'        // Contactar
  | 'review'         // Dejar reseña
  | 'pay'            // Pagar
  | 'book'           // Reservar
  | 'cancel'         // Cancelar
  | 'complete'       // Completar
  | 'archive'        // Archivar
  | 'delete';        // Eliminar

// Interfaz principal de notificación
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  profile: UserProfile;
  
  // Metadatos
  createdAt: Date;
  updatedAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  
  // Deep link / routing
  action?: string;
  entityType?: string;
  entityId?: string;
  roleTarget?: UserProfile | 'both';
  routeHint?: string;
  params?: Record<string, any>;
  
  // Enlaces y acciones
  link?: string;
  actions?: NotificationAction[];
  
  // Datos adicionales específicos del tipo
  metadata?: {
    appointmentId?: string;
    bookingId?: string;
    paymentId?: string;
    userId?: string;
    providerId?: string;
    serviceId?: string;
    amount?: number;
    rating?: number;
    backendId?: string | number;
    notificationId?: string | number;
    appointment_id?: string | number;
    payment_id?: string | number;
    priority?: NotificationPriority;
    description?: string;
    link?: string;
    url?: string;
    actions?: NotificationAction[];
    [key: string]: any;
  };
  
  // Configuración de visualización
  icon?: string;
  color?: string;
  badge?: string;
  sound?: boolean;
  vibration?: boolean;
}

// Configuración de notificaciones por perfil
export interface NotificationConfig {
  profile: UserProfile;
  enabledTypes: NotificationType[];
  priority: {
    [key in NotificationPriority]: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  schedule: {
    quietHours: {
      enabled: boolean;
      start: string; // HH:mm
      end: string;   // HH:mm
    };
    timezone: string;
  };
}

// Template para crear notificaciones
export interface NotificationTemplate {
  type: NotificationType;
  profile: UserProfile;
  title: string;
  message: string;
  description?: string;
  priority: NotificationPriority;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

// Filtros para notificaciones
export interface NotificationFilters {
  type?: NotificationType[];
  status?: NotificationStatus[];
  priority?: NotificationPriority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Estadísticas de notificaciones
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byStatus: Record<NotificationStatus, number>;
}

// Eventos del sistema de notificaciones
export interface NotificationEvent {
  type: 'created' | 'read' | 'read_all' | 'archived' | 'deleted' | 'action_taken';
  notification?: Notification;
  timestamp: Date;
  userId?: string;
}











