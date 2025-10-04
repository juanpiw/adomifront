import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeaderData {
  userName: string;
  hasNotifications: boolean;
}

@Component({
  selector: 'app-inicio-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-header.component.html',
  styleUrls: ['./inicio-header.component.scss']
})
export class InicioHeaderComponent {
  @Input() data: HeaderData = {
    userName: 'Elena',
    hasNotifications: true
  };

  @Output() notificationClick = new EventEmitter<void>();
  @Output() publicProfileClick = new EventEmitter<void>();

  onNotificationClick() {
    this.notificationClick.emit();
  }

  onPublicProfileClick() {
    this.publicProfileClick.emit();
  }
}
