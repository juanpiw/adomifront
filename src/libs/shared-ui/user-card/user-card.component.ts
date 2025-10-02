import { Component, Input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'user-card',
  standalone: true,
  imports: [CommonModule, UpperCasePipe],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class UserCardComponent {
  @Input() name = 'Usuario';
  @Input() email = '';
  @Input() avatarUrl: string | null = null;
}
