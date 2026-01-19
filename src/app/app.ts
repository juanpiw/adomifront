import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalConfirmacionComponent } from '../libs/shared-ui/modal-confirmacion/modal-confirmacion.component';
import { SessionExpiredService } from './core/services/session-expired.service';
import { RouterLoggerService } from './core/services/router-logger.service';
import { Ga4Service } from './core/services/ga4.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ModalConfirmacionComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('adomi-app');
  sessionExpired = inject(SessionExpiredService);
  // Inyección intencional para activar logs de navegación globales.
  private routerLogger = inject(RouterLoggerService);
  // Inyección intencional para activar GA4 (si hay measurement id).
  private ga4 = inject(Ga4Service);
}
