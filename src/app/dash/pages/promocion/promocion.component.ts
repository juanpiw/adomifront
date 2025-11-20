import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PromotionsHeaderComponent,
  CollapsiblePromoFormComponent,
  ActivePromotionsListComponent,
  PromotionsHistoryComponent,
  Promotion,
  PromotionFormData
} from '../../../../libs/shared-ui/promotions';
import { PromotionsService, CreatePromotionDto } from '../../../services/promotions.service';
import { QrDisplayComponent } from '../../../marketing/qr-display/qr-display.component';

@Component({
  selector: 'app-d-promocion',
  standalone: true,
  imports: [
    CommonModule,
    PromotionsHeaderComponent,
    CollapsiblePromoFormComponent,
    ActivePromotionsListComponent,
    PromotionsHistoryComponent,
    QrDisplayComponent
  ],
  templateUrl: './promocion.component.html',
  styleUrls: ['./promocion.component.scss']
})
export class DashPromocionComponent implements OnInit {
  constructor(private promotionsService: PromotionsService) {}

  isFormExpanded = false;
  activePromotions: Promotion[] = [];
  historyPromotions: Promotion[] = [];

  ngOnInit(): void {
    this.loadPromotions();
  }

  private loadPromotions(): void {
    this.promotionsService.list().subscribe({
      next: (resp) => {
        const list = resp.promotions || [];
        const toUi = (p: any): Promotion => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          discountType: p.discount_type,
          discountValue: String(p.discount_value),
          startDate: p.start_date,
          endDate: p.end_date,
          status: (p.status || (p.is_active ? 'active' : 'inactive'))
        });
        const ui = list.map(toUi);
        this.activePromotions = ui.filter(x => x.status === 'active');
        this.historyPromotions = ui.filter(x => x.status !== 'active');
      },
      error: (err) => {
        console.error('[PROMOTIONS] Error list:', err);
        this.activePromotions = [];
        this.historyPromotions = [];
      }
    });
  }

  onFormToggled(expanded: boolean) {
    this.isFormExpanded = expanded;
  }

  onFormSubmitted(data: PromotionFormData) {
    const dto: CreatePromotionDto = {
      name: data.name,
      description: data.description,
      discount_type: data.discountType === 'other' ? 'percentage' : data.discountType,
      discount_value: data.discountValue,
      start_date: data.startDate,
      end_date: data.endDate,
      is_active: true
    };
    this.promotionsService.create(dto).subscribe({
      next: () => { this.isFormExpanded = false; this.loadPromotions(); },
      error: (err) => console.error('[PROMOTIONS] Error create:', err)
    });
  }

  onEditPromotion(promotion: Promotion) {
    // Futuro: precargar formulario y llamar update()
    this.isFormExpanded = true;
  }

  onDeactivatePromotion(promotion: Promotion) {
    this.promotionsService.toggle(promotion.id).subscribe({
      next: () => this.loadPromotions(),
      error: (err) => console.error('[PROMOTIONS] Error toggle:', err)
    });
  }
}
