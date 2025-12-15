import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { SupportEmptyStateComponent } from '../../../../libs/shared-ui/support/support-empty-state/support-empty-state.component';
import { SupportKpisComponent } from '../../../../libs/shared-ui/support/support-kpis/support-kpis.component';
import { SupportShellComponent } from '../../../../libs/shared-ui/support/support-shell/support-shell.component';
import { SupportTicketFormComponent } from '../../../../libs/shared-ui/support/support-ticket-form/support-ticket-form.component';
import { SupportTicketListComponent } from '../../../../libs/shared-ui/support/support-ticket-list/support-ticket-list.component';
import { SupportStoreService } from '../../../../libs/shared-ui/support/services/support-store.service';
import { SupportTicket } from '../../../../libs/shared-ui/support/models/support-ticket.model';

@Component({
  selector: 'app-client-support',
  standalone: true,
  imports: [
    CommonModule,
    SupportShellComponent,
    SupportKpisComponent,
    SupportTicketListComponent,
    SupportTicketFormComponent,
    SupportEmptyStateComponent
  ],
  templateUrl: './client-support.component.html',
  styleUrls: ['./client-support.component.scss']
})
export class ClientSupportComponent implements OnInit {
  private readonly store = inject(SupportStoreService);

  readonly categories = ['Pagos', 'Servicio', 'App', 'Cuenta'];
  readonly isCreating = signal(false);
  readonly selectedTicketId = signal<string | null>(null);

  readonly vm$ = combineLatest([
    this.store.list$('client'),
    this.store.stats$('client')
  ]).pipe(map(([tickets, stats]) => ({ tickets, stats })));

  ngOnInit(): void {
    this.store.load('client').subscribe();
  }

  showForm(): void {
    this.isCreating.set(true);
  }

  onSelect(ticket: SupportTicket): void {
    this.selectedTicketId.set(ticket.id);
  }

  onCreate(ticket: { category: string; subject: string; description: string }): void {
    this.store.create('client', ticket).subscribe(() => {
      this.isCreating.set(false);
    });
  }

  onCancel(): void {
    this.isCreating.set(false);
  }
}

