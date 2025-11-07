import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export interface PortfolioData {
  title?: string;
  items: PortfolioItem[];
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent {
  @Input() data: PortfolioData = {
    title: 'Portafolio',
    items: []
  };

  @Output() itemClick = new EventEmitter<PortfolioItem>();

  onItemClick(item: PortfolioItem) {
    this.itemClick.emit(item);
  }
}













