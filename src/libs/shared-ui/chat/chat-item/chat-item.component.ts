import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatConversation } from '../chat-container/chat-container.component';

@Component({
  selector: 'app-chat-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-item.component.html',
  styleUrls: ['./chat-item.component.scss']
})
export class ChatItemComponent {
  @Input() conversation!: ChatConversation;
  @Input() isActive: boolean = false;

  @Output() select = new EventEmitter<string>();

  onSelect(): void {
    this.select.emit(this.conversation.id);
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
}













