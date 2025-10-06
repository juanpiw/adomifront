import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PromotionsHeaderComponent,
  CollapsiblePromoFormComponent,
  ActivePromotionsListComponent,
  PromotionsHistoryComponent,
  Promotion,
  PromotionFormData
} from '../../../../libs/shared-ui/promotions';

@Component({
  selector: 'app-d-promocion',
  standalone: true,
  imports: [
    CommonModule,
    PromotionsHeaderComponent,
    CollapsiblePromoFormComponent,
    ActivePromotionsListComponent,
    PromotionsHistoryComponent
  ],
  templateUrl: './promocion.component.html',
  styleUrls: ['./promocion.component.scss']
})
export class DashPromocionComponent {
  isFormExpanded = false;
  activePromotions: Promotion[] = [
    {
      id: 1,
      name: '20% Off en Martes',
      description: 'Descuento válido todos los martes en servicios de limpieza.',
      discountType: 'percentage',
      discountValue: '20',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'active',
      usageCount: 12
    }
  ];

  historyPromotions: Promotion[] = [
    {
      id: 101,
      name: '2x1 Corte de Cabello',
      description: 'Trae a un amigo y paga 1',
      discountType: 'other',
      discountValue: '2x1',
      startDate: '2024-10-01',
      endDate: '2024-12-01',
      status: 'expired',
      usageCount: 47
    }
  ];

  onFormToggled(expanded: boolean) {
    this.isFormExpanded = expanded;
  }

  onFormSubmitted(data: PromotionFormData) {
    const newPromo: Promotion = {
      id: Date.now(),
      name: data.name,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',
      usageCount: 0
    };
    this.activePromotions.unshift(newPromo);
    this.isFormExpanded = false;
  }

  onEditPromotion(promotion: Promotion) {
    // Futuro: cargar datos al formulario para edición
    this.isFormExpanded = true;
  }

  onDeactivatePromotion(promotion: Promotion) {
    this.activePromotions = this.activePromotions.filter(p => p.id !== promotion.id);
    this.historyPromotions.unshift({ ...promotion, status: 'inactive' });
  }
}
