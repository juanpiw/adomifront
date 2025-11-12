import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderInviteSummary } from '../../../app/services/provider-invite.service';

@Component({
  selector: 'app-golden-invite-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './golden-invite-modal.component.html',
  styleUrls: ['./golden-invite-modal.component.scss']
})
export class GoldenInviteModalComponent {
  @Input() isOpen = false;
  @Input() summary: ProviderInviteSummary | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() primaryAction = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('golden-invite-modal__backdrop')) {
      this.close.emit();
    }
  }

  onPrimaryAction() {
    this.primaryAction.emit();
  }

  remainingInvites(): number {
    if (!this.summary) return 3;
    const quota = Number(this.summary.quota || 3);
    const verified = Number(this.summary.counts?.verified || 0);
    const issued = Number(this.summary.counts?.issued || 0);
    const registered = Number(this.summary.counts?.registered || 0);
    const consumed = verified + issued + registered;
    return Math.max(quota - consumed, 0);
  }
}

