import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatContainerComponent, ChatConversation, ChatMessage } from '../../../../libs/shared-ui/chat';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-conversaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatContainerComponent, IconComponent],
  templateUrl: './conversaciones.component.html',
  styleUrls: ['./conversaciones.component.scss']
})
export class ConversacionesComponent implements OnInit {
  conversations: ChatConversation[] = [];
  currentConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  currentUserId = 'CLIENT-001';
  currentUserName = 'Cliente';
  loading = true;
  
  // Estado para móvil
  showConversationsList = true;
  showChatView = false;
  newMessage = '';
  showUsersMenu = false;
  
  // Acceso a window para responsive
  window = typeof window !== 'undefined' ? window : { innerWidth: 1024 } as any;

  constructor(private menuService: MenuService) {}

  ngOnInit() {
    this.loadConversations();
  }

  private loadConversations() {
    // Simular carga de datos
    setTimeout(() => {
      this.conversations = [
        {
          id: 'conv-1',
          clientId: 'CLIENT-001',
          clientName: 'Elena Torres',
          unreadCount: 2,
          isActive: false,
          status: 'active',
          lastMessage: {
            id: 'msg-1',
            content: '¡Hola! ¿Está disponible para mañana?',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            senderId: 'CLIENT-001',
            senderName: 'Elena Torres',
            senderType: 'client',
            isRead: true
          }
        },
        {
          id: 'conv-2',
          clientId: 'CLIENT-002',
          clientName: 'Carlos Mendoza',
          unreadCount: 0,
          isActive: false,
          status: 'inactive',
          lastMessage: {
            id: 'msg-2',
            content: 'Perfecto, muchas gracias por confirmar.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
            senderId: 'PRO-001',
            senderName: 'Javier Núñez',
            senderType: 'professional',
            isRead: true
          }
        },
        {
          id: 'conv-3',
          clientId: 'CLIENT-003',
          clientName: 'María González',
          unreadCount: 1,
          isActive: false,
          status: 'active',
          lastMessage: {
            id: 'msg-3',
            content: '¿Podrías confirmar la hora de la cita?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            senderId: 'CLIENT-003',
            senderName: 'María González',
            senderType: 'client',
            isRead: true
          }
        }
      ];

      // Seleccionar la primera conversación por defecto
      if (this.conversations.length > 0) {
        this.selectConversation(this.conversations[0].id);
      }

      this.loading = false;
    }, 1000);
  }

  selectConversation(conversationId: string) {
    // Marcar todas las conversaciones como inactivas
    this.conversations.forEach(conv => conv.isActive = false);
    
    // Encontrar y activar la conversación seleccionada
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.isActive = true;
      conversation.unreadCount = 0; // Marcar como leída
      this.currentConversation = conversation;
      this.loadMessages(conversationId);
      
      // En móvil, cambiar a vista de chat
      if (this.isMobile()) {
        this.showConversationsList = false;
        this.showChatView = true;
      }
    }
  }

  backToConversationsList() {
    this.showConversationsList = true;
    this.showChatView = false;
    this.showUsersMenu = false;
  }

  toggleUsersMenu() {
    this.showUsersMenu = !this.showUsersMenu;
  }

  selectUserFromMenu(conversationId: string) {
    this.selectConversation(conversationId);
    this.showUsersMenu = false;
  }

  toggleGeneralMenu() {
    console.log('Abriendo/cerrando menú general del layout');
    this.menuService.toggleMenu();
  }

  private loadMessages(conversationId: string) {
    // Simular carga de mensajes según la conversación
    const sampleMessages: { [key: string]: ChatMessage[] } = {
      'conv-1': [
        {
          id: 'msg-1',
          content: '¡Hola! ¿Está disponible para mañana?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          senderId: 'CLIENT-001',
          senderName: 'Elena Torres',
          senderType: 'client',
          isRead: true
        },
        {
          id: 'msg-2',
          content: '¡Hola Elena! Sí, tengo disponibilidad mañana. ¿Qué servicio te interesa?',
          timestamp: new Date(Date.now() - 1000 * 60 * 25),
          senderId: 'PRO-001',
          senderName: 'Javier Núñez',
          senderType: 'professional',
          isRead: true
        },
        {
          id: 'msg-3',
          content: 'Me interesa el servicio de Soporte Técnico. ¿Podría ser a las 2:00 PM?',
          timestamp: new Date(Date.now() - 1000 * 60 * 20),
          senderId: 'CLIENT-001',
          senderName: 'Elena Torres',
          senderType: 'client',
          isRead: true
        }
      ],
      'conv-2': [
        {
          id: 'msg-4',
          content: 'Hola, ¿podrías ayudarme con mi computadora?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          senderId: 'CLIENT-002',
          senderName: 'Carlos Mendoza',
          senderType: 'client',
          isRead: true
        },
        {
          id: 'msg-5',
          content: 'Por supuesto, ¿qué problema específico tienes?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23),
          senderId: 'PRO-001',
          senderName: 'Javier Núñez',
          senderType: 'professional',
          isRead: true
        },
        {
          id: 'msg-6',
          content: 'Perfecto, muchas gracias por confirmar.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
          senderId: 'CLIENT-002',
          senderName: 'Carlos Mendoza',
          senderType: 'client',
          isRead: true
        }
      ],
      'conv-3': [
        {
          id: 'msg-7',
          content: 'Buenos días, ¿está disponible para hoy?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          senderId: 'CLIENT-003',
          senderName: 'María González',
          senderType: 'client',
          isRead: true
        },
        {
          id: 'msg-8',
          content: 'Sí, tengo disponibilidad. ¿Qué servicio necesitas?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
          senderId: 'PRO-001',
          senderName: 'Javier Núñez',
          senderType: 'professional',
          isRead: true
        },
        {
          id: 'msg-9',
          content: '¿Podrías confirmar la hora de la cita?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
          senderId: 'CLIENT-003',
          senderName: 'María González',
          senderType: 'client',
          isRead: true
        }
      ]
    };

    this.messages = sampleMessages[conversationId] || [];
  }

  onSendMessage(event: { conversationId: string; content: string }) {
    console.log('Enviando mensaje:', event);
    
    // Crear nuevo mensaje
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: event.content,
      timestamp: new Date(),
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      senderType: 'client',
      isRead: true
    };

    // Agregar mensaje a la lista
    this.messages.push(newMessage);

    // Actualizar último mensaje en la conversación
    if (this.currentConversation) {
      this.currentConversation.lastMessage = newMessage;
    }

    // Simular respuesta automática después de 2 segundos
    setTimeout(() => {
      const response: ChatMessage = {
        id: `msg-${Date.now()}`,
        content: 'Perfecto, gracias por tu mensaje. Te responderé pronto.',
        timestamp: new Date(),
        senderId: 'PRO-001',
        senderName: 'Javier Núñez',
        senderType: 'professional',
        isRead: true
      };
      
      this.messages.push(response);
      
      // Actualizar último mensaje en la conversación
      if (this.currentConversation) {
        this.currentConversation.lastMessage = response;
      }
    }, 2000);
  }

  onSearchConversations(query: string) {
    console.log('Buscando conversaciones:', query);
    // TODO: Implementar búsqueda real
  }

  onViewAppointment(clientId: string) {
    console.log('Ver cita para cliente:', clientId);
    // TODO: Implementar navegación a cita
  }

  getTotalUnreadCount(): number {
    return this.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }

  getClientInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isMessageFromCurrentUser(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.currentConversation && this.newMessage.trim()) {
        this.onSendMessage({ conversationId: this.currentConversation.id, content: this.newMessage.trim() });
        this.newMessage = '';
      }
    }
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }
}
