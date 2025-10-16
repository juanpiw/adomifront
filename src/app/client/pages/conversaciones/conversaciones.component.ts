import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatContainerComponent, ChatConversation, ChatMessage } from '../../../../libs/shared-ui/chat';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';
import { MenuService } from '../../services/menu.service';
import { ChatService, ConversationDto, MessageDto } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-conversaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatContainerComponent, IconComponent],
  templateUrl: './conversaciones.component.html',
  styleUrls: ['./conversaciones.component.scss']
})
export class ConversacionesComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  currentConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  currentUserId = '0';
  currentUserName = 'Usuario';
  loading = true;
  
  // Estado para móvil
  showConversationsList = true;
  showChatView = false;
  newMessage = '';
  showUsersMenu = false;
  
  // Acceso a window para responsive
  window = typeof window !== 'undefined' ? window : { innerWidth: 1024 } as any;

  private subs: Subscription[] = [];

  constructor(private menuService: MenuService, private chat: ChatService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    try {
      const raw = localStorage.getItem('adomi_user');
      const user = raw ? JSON.parse(raw) : null;
      if (user?.id) this.currentUserId = String(user.id);
      if (user?.name) this.currentUserName = String(user.name);
    } catch {}

    this.chat.connectSocket();
    this.subs.push(
      this.chat.onMessageNew().subscribe((msg) => {
        // si corresponde a la conversación activa, prepend
        if (this.currentConversation && Number(this.currentConversation.id) === Number(msg.conversation_id)) {
          this.messages.unshift(this.mapMessage(msg));
        }
        // actualizar preview/unread en la lista
        const conv = this.conversations.find(c => Number(c.id) === Number(msg.conversation_id));
        if (conv) {
          conv.lastMessage = this.mapMessage(msg);
          if (String(msg.sender_id) !== this.currentUserId && (!this.currentConversation || conv.id !== this.currentConversation.id)) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
        }
      })
    );
    // Si viene providerId por query, auto-crear/abrir conversación primero
    const qp = this.route.snapshot.queryParamMap;
    const providerId = qp.get('providerId');
    const providerName = qp.get('providerName');
    if (providerId) {
      const clientId = Number(this.currentUserId);
      const pid = Number(providerId);
      if (clientId && pid) {
        this.chat.createOrGetConversation(clientId, pid).subscribe({
          next: (resp) => {
            const conv = this.mapConversation(resp.conversation);
            if (providerName) conv.clientName = providerName;
            const exists = this.conversations.some(c => c.id === conv.id);
            if (!exists) this.conversations.unshift(conv);
            this.selectConversation(conv.id);
            this.router.navigate([], { queryParams: {} });
            // cargar lista en segundo plano
            this.loadConversations();
          },
          error: () => {
            // fallback: cargar lista normal
            this.loadConversations();
          }
        });
        return;
      }
    }
    this.loadConversations();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  private loadConversations() {
    const uid = Number(this.currentUserId);
    this.chat.listConversations(uid).subscribe({
      next: (resp) => {
        this.conversations = (resp.conversations || []).map(c => this.mapConversation(c));
        // Unirse a todas las salas para recibir message:new aunque no estén activas
        try {
          this.conversations.forEach(c => this.chat.joinConversation(Number(c.id)));
        } catch {}
        if (this.conversations.length > 0) {
          this.selectConversation(this.conversations[0].id);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
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
      // Unirse a la sala socket para esta conversación
      try { this.chat.joinConversation(Number(conversationId)); } catch {}
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
    this.chat.listMessages(Number(conversationId), { limit: 50 }).subscribe({
      next: (resp) => {
        const list = (resp.messages || []).map(m => this.mapMessage(m));
        this.messages = list;
      }
    });
  }

  onSendMessage(event: { conversationId: string; content: string }) {
    const convId = Number(event.conversationId || this.currentConversation?.id);
    if (!convId || !event.content || !this.currentConversation) return;
    const dto = (this.currentConversation as any).__dto as ConversationDto | undefined;
    const userId = Number(this.currentUserId);
    const receiverId = dto ? (userId === Number(dto.client_id) ? Number(dto.provider_id) : Number(dto.client_id)) : 0;
    if (!receiverId) return;
    // Inserción optimista
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: event.content,
      timestamp: new Date(),
      senderId: String(this.currentUserId),
      senderName: 'Tú',
      senderType: 'professional',
      isRead: true
    };
    this.messages.unshift(optimistic);
    this.currentConversation.lastMessage = optimistic;

    this.chat.sendMessage(convId, receiverId, event.content).subscribe({
      next: (resp) => {
        // Reemplazar optimista con respuesta real
        const idx = this.messages.findIndex(m => m.id === optimistic.id);
        const real = this.mapMessage(resp.message);
        if (idx >= 0) {
          this.messages.splice(idx, 1, real);
        } else {
          this.messages.unshift(real);
        }
        this.currentConversation!.lastMessage = real;
      },
      error: () => {
        // Revertir inserción optimista si falla
        const idx = this.messages.findIndex(m => m.id === optimistic.id);
        if (idx >= 0) this.messages.splice(idx, 1);
      }
    });
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

  private mapConversation(c: ConversationDto): ChatConversation {
    const otherLabel = (c as any).provider_name || (c as any).client_name || 'Contacto';
    const last: ChatMessage | undefined = c.last_message_id ? {
      id: String(c.last_message_id),
      content: c.last_message_preview || '',
      timestamp: c.last_message_at ? new Date(c.last_message_at) : new Date(),
      senderId: '',
      senderName: otherLabel,
      senderType: 'client',
      isRead: true
    } : undefined;
    const conv: ChatConversation = {
      id: String(c.id),
      clientId: String(c.client_id),
      clientName: otherLabel,
      unreadCount: Number(c.unread_count || 0),
      isActive: false,
      status: 'active',
      lastMessage: last
    };
    (conv as any).__dto = c;
    return conv;
  }

  private mapMessage(m: MessageDto): ChatMessage {
    const userId = Number(this.currentUserId);
    const fromCurrent = Number(m.sender_id) === userId;
    return {
      id: String(m.id),
      content: m.content,
      timestamp: new Date(m.created_at),
      senderId: String(m.sender_id),
      senderName: fromCurrent ? 'Tú' : 'Contacto',
      senderType: fromCurrent ? 'professional' : 'client',
      isRead: !!m.read_at
    };
  }
}
