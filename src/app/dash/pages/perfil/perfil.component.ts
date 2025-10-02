import { Component } from '@angular/core';
import { UiInputComponent } from '../../../../libs/shared-ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../libs/shared-ui/ui-button/ui-button.component';
import { AvatarUploaderComponent } from '../../../../libs/shared-ui/avatar-uploader/avatar-uploader.component';
import { LanguageSelectComponent } from '../../../../libs/shared-ui/language-select/language-select.component';
import { NotificationToggleComponent } from '../../../../libs/shared-ui/notification-toggle/notification-toggle.component';

@Component({
  selector: 'app-d-perfil',
  standalone: true,
  imports: [UiInputComponent, UiButtonComponent, AvatarUploaderComponent, LanguageSelectComponent, NotificationToggleComponent],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class DashPerfilComponent {
  name = '';
  bio = '';
  phone = '';
  avatar: string | null = null;
  lang = 'es';
  emailNoti = true;
  pushNoti = true;

  save() { /* TODO persist */ }
}
