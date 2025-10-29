import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
export class IncomeGoalsComponent implements OnChanges {
  @Input() currentGoal: IncomeGoal | null = null;
  @Input() currentIncome: number = 0;
  @Input() savingGoal = false;
  @Input() goalError: string | null = null;
  
  @Output() goalSet = new EventEmitter<IncomeGoal>();
  @Output() goToSummary = new EventEmitter<void>();

  newGoal: IncomeGoal = {
    amount: 0,
    period: 'mensual',
    setDate: new Date().toISOString().split('T')[0]
  };

  isSettingGoal = false;
  showCompletionMessage = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savingGoal']) {
      this.isSettingGoal = this.savingGoal;

      const prev = changes['savingGoal'].previousValue;
      if (prev && !this.savingGoal && !this.goalError) {
        this.newGoal = {
          amount: 0,
          period: this.newGoal.period,
          setDate: new Date().toISOString().split('T')[0]
        };
      }
    }

    if (changes['currentGoal'] || changes['currentIncome']) {
      if (this.isGoalCompleted) {
        this.showCompletionMessage = true;
        setTimeout(() => {
          this.showCompletionMessage = false;
        }, 5000);
      }
    }
  }

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
      this.goalSet.emit({ ...this.newGoal });
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
