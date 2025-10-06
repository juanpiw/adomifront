import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { IncomeGoal } from '../interfaces';

@Component({
  selector: 'ui-income-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './income-goals.component.html',
  styleUrls: ['./income-goals.component.scss']
})
export class IncomeGoalsComponent {
  @Input() currentGoal: IncomeGoal | null = null;
  @Input() currentIncome: number = 0;
  
  @Output() goalSet = new EventEmitter<IncomeGoal>();
  @Output() goToSummary = new EventEmitter<void>();

  newGoal: IncomeGoal = {
    amount: 0,
    period: 'mensual',
    setDate: new Date().toISOString().split('T')[0]
  };

  isSettingGoal = false;
  showCompletionMessage = false;

  get progressPercentage(): number {
    if (!this.currentGoal || this.currentGoal.amount === 0) return 0;
    return Math.min((this.currentIncome / this.currentGoal.amount) * 100, 100);
  }

  get isGoalCompleted(): boolean {
    return this.progressPercentage >= 100;
  }

  onSetGoal() {
    if (this.newGoal.amount > 0) {
      this.isSettingGoal = true;
      
      // Simular establecimiento de meta
      setTimeout(() => {
        this.isSettingGoal = false;
        this.currentGoal = { ...this.newGoal };
        this.goalSet.emit(this.currentGoal);
        
        if (this.isGoalCompleted) {
          this.showCompletionMessage = true;
          setTimeout(() => {
            this.showCompletionMessage = false;
          }, 5000);
        }
      }, 1000);
    }
  }

  onGoToSummary() {
    this.goToSummary.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
