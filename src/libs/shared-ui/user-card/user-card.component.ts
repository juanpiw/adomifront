import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UserCardData {
  id: string;
  name: string;
  profession: string;
  avatar: string;
  rating: number;
  reviews: number;
  description?: string;
  location?: string;
  isHighlighted?: boolean;
}

@Component({
  selector: 'ui-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class UserCardComponent {
  @Input() user: UserCardData | null = null;
  @Input() buttonText: string = 'Ver perfil y Agendar';
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
    event.stopPropagation();
    if (this.user) {
      this.buttonClick.emit(this.user);
    }
  }

  getCardClasses(): string {
    const baseClasses = 'user-card rounded-2xl border-2 mb-4 transition-all duration-300';
    
    switch (this.variant) {
      case 'highlighted':
        return `${baseClasses} border-indigo-500 bg-indigo-50 highlighted-card`;
      default:
        return `${baseClasses} border-slate-200 bg-white`;
    }
  }

  getAvatarClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'w-12 h-12 rounded-lg';
      case 'lg':
        return 'w-20 h-20 rounded-xl';
      default:
        return 'w-16 h-16 rounded-xl';
    }
  }

  getNameClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'font-bold text-base text-slate-900';
      case 'lg':
        return 'font-bold text-xl text-slate-900';
      default:
        return 'font-bold text-lg text-slate-900';
    }
  }

  getProfessionClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'text-xs text-slate-600';
      case 'lg':
        return 'text-base text-slate-600';
      default:
        return 'text-sm text-slate-600';
    }
  }

  getStarClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'w-4 h-4 text-yellow-400';
      case 'lg':
        return 'w-6 h-6 text-yellow-400';
      default:
        return 'w-5 h-5 text-yellow-400';
    }
  }

  getRatingClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'text-slate-700 font-semibold ml-1 text-sm';
      case 'lg':
        return 'text-slate-700 font-semibold ml-1 text-lg';
      default:
        return 'text-slate-700 font-semibold ml-1';
    }
  }

  getReviewsClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'text-slate-500 text-xs ml-2';
      case 'lg':
        return 'text-slate-500 text-base ml-2';
      default:
        return 'text-slate-500 text-sm ml-2';
    }
  }

  getButtonClasses(): string {
    const baseClasses = 'mt-3 w-full bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 action-button';
    
    switch (this.size) {
      case 'sm':
        return `${baseClasses} py-2 text-sm`;
      case 'lg':
        return `${baseClasses} py-3 text-lg`;
      default:
        return `${baseClasses} py-2.5`;
    }
  }
}