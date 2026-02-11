import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'theme-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-switch.component.html',
  styleUrls: ['./theme-switch.component.scss']
})
export class ThemeSwitchComponent {
  private themeService = inject(ThemeService);
  theme = this.themeService.theme;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() iconOnly = false;
  @Input() ariaLabel = 'Toggle theme';

  toggleTheme() {
    this.themeService.toggle();
  }
}
