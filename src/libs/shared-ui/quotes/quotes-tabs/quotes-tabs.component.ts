import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteTab } from '../quotes.models';

@Component({
  selector: 'ui-quotes-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quotes-tabs.component.html',
  styleUrls: ['./quotes-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotesTabsComponent {
  @Input() tabs: QuoteTab[] = [];
  @Input() activeTabId: QuoteTab['id'] = 'new';
  @Output() tabChange = new EventEmitter<QuoteTab['id']>();

  onSelectTab(tabId: QuoteTab['id']): void {
    if (tabId === this.activeTabId) return;
    this.tabChange.emit(tabId);
  }
}


