import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Promotion } from '../index';

@Component({
  selector: 'ui-history-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-item.component.html',
  styleUrls: ['./history-item.component.scss']
})
export class HistoryItemComponent {
  @Input() promotion!: Promotion;
}









