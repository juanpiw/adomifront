import { Component } from '@angular/core';
import { UiInputComponent } from '../../../libs/shared-ui/ui-input/ui-input.component';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { UiButtonComponent } from '../../../libs/shared-ui/ui-button/ui-button.component';
import { UiDropdownComponent } from '../../../libs/shared-ui/ui-dropdown/ui-dropdown.component';
import { UiDateComponent } from '../../../libs/shared-ui/ui-date/ui-date.component';
import { UserCardComponent } from '../../../libs/shared-ui/user-card/user-card.component';
import { UiCalendarComponent } from '../../../libs/shared-ui/ui-calendar/ui-calendar.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [UiInputComponent, ThemeSwitchComponent, UiButtonComponent, UiDropdownComponent, UiDateComponent, UserCardComponent, UiCalendarComponent],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent {}
