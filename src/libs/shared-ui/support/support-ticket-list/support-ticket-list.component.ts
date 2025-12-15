import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { SupportTicket } from '../models/support-ticket.model';

@Component({
  selector: 'ui-support-ticket-list',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './support-ticket-list.component.html',
  styleUrls: ['./support-ticket-list.component.scss']
})
export class SupportTicketListComponent {
  @Input() tickets: SupportTicket[] | null = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<SupportTicket>();

  trackById(_: number, item: SupportTicket): string {
    return item.id;
  }

  onSelect(ticket: SupportTicket): void {
    this.select.emit(ticket);
  }

  badgeClass(status: SupportTicket['status']): string {
    if (status === 'abierto') return 'badge badge--open';
    if (status === 'en_proceso') return 'badge badge--progress';
    return 'badge badge--closed';
  }
}

