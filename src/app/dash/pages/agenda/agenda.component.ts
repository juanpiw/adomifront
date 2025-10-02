import { Component } from '@angular/core';
import { UiCalendarComponent } from '../../../../libs/shared-ui/ui-calendar/ui-calendar.component';

@Component({
  selector: 'app-d-agenda',
  standalone: true,
  imports: [UiCalendarComponent],
  template: `<h2>Agenda</h2><ui-calendar></ui-calendar>`
})
export class DashAgendaComponent {}
