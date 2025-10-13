import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalConfirmacionComponent } from '../libs/shared-ui/modal-confirmacion/modal-confirmacion.component';
import { SessionExpiredService } from './core/services/session-expired.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ModalConfirmacionComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('adomi-app');
  sessionExpired = inject(SessionExpiredService);
}
