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
    const summary = this.summary;
    if (!summary) return 3;
    const quota = Number(summary.quota ?? 3);
    const counts = summary.counts;
    const verified = Number(counts.verified ?? 0);
    const issued = Number(counts.issued ?? 0);
    const registered = Number(counts.registered ?? 0);
    const consumed = verified + issued + registered;
    return Math.max(quota - consumed, 0);
  }
}

