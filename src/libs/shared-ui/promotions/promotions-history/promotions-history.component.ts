import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Promotion } from '../index';
import { HistoryItemComponent } from '../history-item/history-item.component';

@Component({
  selector: 'ui-promotions-history',
  standalone: true,
  imports: [CommonModule, HistoryItemComponent],
  templateUrl: './promotions-history.component.html',
  styleUrls: ['./promotions-history.component.scss']
})
export class PromotionsHistoryComponent {
  @Input() promotions: Promotion[] = [];
}









