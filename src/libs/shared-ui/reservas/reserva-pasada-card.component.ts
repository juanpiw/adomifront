import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { CommonModule } from '@angular/common';

export interface ReservaPasadaData {
  avatarUrl: string;
  titulo: string;
  fecha: string;
  precio: string;
  estado?: string; // Completado, etc.
  appointmentId?: number;
  providerId?: number;
  isFavorite?: boolean;
  verificationCode?: string;
  isPaid?: boolean;
}

@Component({
  selector: 'ui-reserva-pasada-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './reserva-pasada-card.component.html',
  styleUrls: ['./reserva-pasada-card.component.scss']
})
export class ReservaPasadaCardComponent {
  @Input() data!: ReservaPasadaData;
  @Output() onReview = new EventEmitter<void>();
  @Output() onReschedule = new EventEmitter<void>();
  @Output() onToggleFavorite = new EventEmitter<void>();
  @Input() expanded: boolean = false;

  private avatarBroken = false;

  get avatarSrc(): string {
    if (!this.data?.avatarUrl || this.avatarBroken) {
      return this.buildPlaceholder(this.data?.titulo);
    }
    return this.data.avatarUrl;
  }

  onAvatarError(event: Event): void {
    if (this.avatarBroken) return;
    this.avatarBroken = true;
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = this.buildPlaceholder(this.data?.titulo);
    }
  }

  private buildPlaceholder(text?: string | null): string {
    const initial = (text || 'A').trim().charAt(0).toUpperCase() || 'A';
    const encoded = encodeURIComponent(initial);
    return `https://placehold.co/64x64/0f172a/ffffff?text=${encoded}`;
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }
}
