import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Promotion } from '../index';
import { PromotionCardComponent } from '../promotion-card/promotion-card.component';

@Component({
  selector: 'ui-active-promotions-list',
  standalone: true,
  imports: [CommonModule, PromotionCardComponent],
  templateUrl: './active-promotions-list.component.html',
  styleUrls: ['./active-promotions-list.component.scss']
})
export class ActivePromotionsListComponent {
  @Input() promotions: Promotion[] = [];
  @Output() editPromotion = new EventEmitter<Promotion>();
  @Output() deactivatePromotion = new EventEmitter<Promotion>();

  onEdit(promotion: Promotion) {
    this.editPromotion.emit(promotion);
  }

  onDeactivate(promotion: Promotion) {
    this.deactivatePromotion.emit(promotion);
  }
}














