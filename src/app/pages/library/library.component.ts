import { Component } from '@angular/core';
import { UiInputComponent } from '../../../libs/shared-ui/ui-input/ui-input.component';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { UiButtonComponent } from '../../../libs/shared-ui/ui-button/ui-button.component';
import { UiDropdownComponent } from '../../../libs/shared-ui/ui-dropdown/ui-dropdown.component';
import { UiDateComponent } from '../../../libs/shared-ui/ui-date/ui-date.component';
import { UserCardComponent, UserCardData } from '../../../libs/shared-ui/user-card/user-card.component';
import { UiCalendarComponent } from '../../../libs/shared-ui/ui-calendar/ui-calendar.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [UiInputComponent, ThemeSwitchComponent, UiButtonComponent, UiDropdownComponent, UiDateComponent, UserCardComponent, UiCalendarComponent],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent {
  mockUser: UserCardData = {
    id: '1',
    name: 'Jane Doe',
    profession: 'Developer',
    avatar: 'https://placehold.co/64x64/C7D2FE/4338CA?text=JD',
    rating: 4.8,
    reviews: 42,
    description: 'Experienced developer with 5+ years',
    location: 'Santiago',
    isHighlighted: false
  };
}
