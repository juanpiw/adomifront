import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent {}
