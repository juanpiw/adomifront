import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UserCardData {
  id: string;
  name: string;
  profession: string;
  avatar: string;
  rating: number;
  reviews: number;
  description?: string;
  location?: string; // optional for compatibility with callers
  isHighlighted?: boolean;
  isOnline?: boolean; // online indicator
}

@Component({
  selector: 'ui-user-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class UserCardComponent {
  @Input() user: UserCardData | null = null;
  @Input() buttonText: string = 'Ver perfil y Agendar';

  // Compatibility inputs (not currently used in template styling)
  @Input() showRating: boolean = true;
  @Input() variant: 'default' | 'highlighted' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() userClick = new EventEmitter<UserCardData>();
  @Output() buttonClick = new EventEmitter<UserCardData>();

  onUserClick() {
    if (this.user) {
      this.userClick.emit(this.user);
    }
  }

  onButtonClick(event: Event) {
    event.stopPropagation(); // Evita que el evento click se propague a la tarjeta contenedora
    if (this.user) {
      this.buttonClick.emit(this.user);
    }
  }
}