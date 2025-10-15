import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Promotion } from '../index';

@Component({
  selector: 'ui-promotion-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promotion-card.component.html',
  styleUrls: ['./promotion-card.component.scss']
})
export class PromotionCardComponent {
  @Input() promotion!: Promotion;
  @Output() editClicked = new EventEmitter<Promotion>();
  @Output() deactivateClicked = new EventEmitter<Promotion>();

  onEdit() {
    this.editClicked.emit(this.promotion);
  }

  onDeactivate() {
    this.deactivateClicked.emit(this.promotion);
  }
}








