import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName = 'home'|'calendar'|'money'|'chart'|'star'|'message'|'briefcase'|'user'|'settings'|'bell'|'card'|'logout'|'heart'|'chevron-left'|'chevron-right'|'menu'|'alert-triangle'|'clock'|'info'|'x'|'search'|'users'|'briefcase';

@Component({
  selector: 'ui-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss']
})
export class IconComponent {
  @Input() name: IconName = 'home';
  @Input() size = 18;
}
