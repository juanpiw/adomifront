import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiItem } from '../index';

@Component({
  selector: 'ui-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.scss']
})
export class KpiCardsComponent {
  @Input() items: KpiItem[] = [];
}


