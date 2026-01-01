import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-support-kpis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-kpis.component.html',
  styleUrls: ['./support-kpis.component.scss']
})
export class SupportKpisComponent {
  @Input() open = 0;
  @Input() closed = 0;
}




