import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderType: 'client' | 'professional';
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.scss']
})
export class ChatContainerComponent implements AfterViewInit, OnChanges {
  @Input() conversations: ChatConversation[] = [];
  @Input() currentConversation: ChatConversation | null = null;
  @Input() messages: ChatMessage[] = [];
  @Input() currentUserId: string = '';
  @Input() currentUserName: string = '';
  @Input() set isOpen(value: boolean) {
    console.log('ChatContainer: isOpen changed to:', value);
    this._isOpen = value;
  }
  get isOpen(): boolean {
    return this._isOpen;
  }
  private _isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() sendMessage = new EventEmitter<{ conversationId: string; content: string }>();
  @Output() selectConversation = new EventEmitter<string>();
  @Output() searchConversations = new EventEmitter<string>();
  @Output() viewAppointment = new EventEmitter<string>();
  @Output() deleteConversation = new EventEmitter<string>();
  @Output() toggleStar = new EventEmitter<string>();

  newMessage: string = '';
  searchQuery: string = '';
  openMenuId: string | null = null;
  @ViewChild('messagesArea') messagesAreaRef?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      // cuando cambian los mensajes, mover al fondo
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSendMessage(): void {
    if (this.newMessage.trim() && this.currentConversation) {
      this.sendMessage.emit({
        conversationId: this.currentConversation.id,
        content: this.newMessage.trim()
      });
      this.newMessage = '';
    }
  }

  onSelectConversation(conversationId: string): void {
    this.selectConversation.emit(conversationId);
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesAreaRef?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  onSearchChange(): void {
    this.searchConversations.emit(this.searchQuery);
  }

  onViewAppointment(): void {
    if (this.currentConversation) {
      this.viewAppointment.emit(this.currentConversation.clientId);
    }
  }

  toggleMenu(conversationId: string): void {
    this.openMenuId = this.openMenuId === conversationId ? null : conversationId;
  }

  requestDelete(conversationId: string): void {
    this.openMenuId = null;
    this.deleteConversation.emit(conversationId);
  }

  markStarred(conversationId: string): void {
    this.openMenuId = null;
    this.toggleStar.emit(conversationId);
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(timestamp: Date): string {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffTime = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `${diffDays} días`;
    } else {
      return messageDate.toLocaleDateString('es-ES');
    }
  }

  getClientInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isMessageFromCurrentUser(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }
}
