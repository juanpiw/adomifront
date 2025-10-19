import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  isExpanded?: boolean;
}

export interface FaqData {
  title?: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {
  @Input() data: FaqData = {
    title: 'Preguntas Frecuentes',
    items: []
  };

  @Output() itemClick = new EventEmitter<FaqItem>();
  @Output() itemToggle = new EventEmitter<FaqItem>();

  onItemClick(item: FaqItem) {
    this.itemClick.emit(item);
  }

  onItemToggle(item: FaqItem) {
    item.isExpanded = !item.isExpanded;
    this.itemToggle.emit(item);
  }
}







