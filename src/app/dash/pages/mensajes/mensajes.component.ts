import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatConversation, ChatMessage } from '../../../../libs/shared-ui/chat';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';
import { ChatService, ConversationDto, MessageDto } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-d-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './mensajes.component.html',
  styleUrls: ['./mensajes.component.scss']
})
export class DashMensajesComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  currentConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  currentUserId = '0';
  currentUserName = 'Proveedor';
  loading = true;
  
  // Estado para móvil
  showConversationsList = true;
  showChatView = false;
  newMessage = '';
  showUsersMenu = false;
  openMenuId: string | null = null;
  
  // Acceso a window para responsive
  window = typeof window !== 'undefined' ? window : { innerWidth: 1024 } as any;

  private subs: Subscription[] = [];

  constructor(private chat: ChatService) {}

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
        console.log('[PRO CHAT] message:new received', msg);
        if (this.currentConversation && Number(this.currentConversation.id) === Number(msg.conversation_id)) {
          console.log('[PRO CHAT] append to active conversation', this.currentConversation.id);
          this.messages.unshift(this.mapMessage(msg));
        }
        const conv = this.conversations.find(c => Number(c.id) === Number(msg.conversation_id));
        if (conv) {
          console.log('[PRO CHAT] update preview/unread for conv', conv.id);
          conv.lastMessage = this.mapMessage(msg);
          if (String(msg.sender_id) !== this.currentUserId && (!this.currentConversation || conv.id !== this.currentConversation.id)) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
        }
      })
    );

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
        // Unirse a todas las salas para recibir en tiempo real
        try { this.conversations.forEach(c => this.chat.joinConversation(Number(c.id))); } catch {}
        if (this.conversations.length > 0) this.selectConversation(this.conversations[0].id);
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
      this.chat.joinConversation(Number(conversationId));
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

  private loadMessages(conversationId: string) {
    this.chat.listMessages(Number(conversationId), { limit: 50 }).subscribe({
      next: (resp) => {
        this.messages = (resp.messages || []).map(m => this.mapMessage(m));
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
    this.chat.sendMessage(convId, receiverId, event.content).subscribe({
      next: (resp) => {
        const msg = this.mapMessage(resp.message);
        this.messages.unshift(msg);
        this.currentConversation!.lastMessage = msg;
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

  toggleMenu(conversationId: string) {
    this.openMenuId = this.openMenuId === conversationId ? null : conversationId;
  }

  onDeleteConversation(conversationId: string) {
    const id = Number(conversationId);
    if (!id) return;
    this.chat.deleteConversation(id).subscribe({
      next: () => {
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        if (this.currentConversation?.id === conversationId) {
          this.currentConversation = null;
          this.messages = [];
        }
        this.openMenuId = null;
      }
    });
  }

  onToggleStar(conversationId: string) {
    console.log('Destacar conversación', conversationId);
    this.openMenuId = null;
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
    const otherLabel = (c as any).client_name || (c as any).provider_name || 'Contacto';
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
