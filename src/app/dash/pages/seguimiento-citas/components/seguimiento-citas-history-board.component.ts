import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SeguimientoHistoryEntry {
  initials?: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
  statusLabel?: string;
}

@Component({
  selector: 'app-seguimiento-citas-history-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento-citas-history-board.component.html',
  styleUrls: ['./seguimiento-citas-history-board.component.scss']
})
export class SeguimientoCitasHistoryBoardComponent {
  @Input() pendingClose: SeguimientoHistoryEntry[] = [];
  @Input() disputedClose: SeguimientoHistoryEntry[] = [];
  @Input() successfulClose: SeguimientoHistoryEntry[] = [];

  @Output() validateClose = new EventEmitter<SeguimientoHistoryEntry>();
  @Output() reviewCase = new EventEmitter<SeguimientoHistoryEntry>();
}
