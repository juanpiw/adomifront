import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Quote } from '../quotes.models';
import { IconComponent } from '../../../shared-ui/icon/icon.component';

@Component({
  selector: 'ui-client-request-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, DatePipe],
  templateUrl: './client-request-panel.component.html',
  styleUrls: ['./client-request-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientRequestPanelComponent {
  @Input() quote!: Quote;
  @Input() enableChat = true;
  @Output() chat = new EventEmitter<void>();

  onChat(): void {
    if (!this.enableChat) return;
    this.chat.emit();
  }
}


