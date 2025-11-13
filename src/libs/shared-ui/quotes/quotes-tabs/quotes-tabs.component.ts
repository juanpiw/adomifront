import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteTab, QuotesTabId } from '../quotes.models';

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
  @Input() activeTabId: QuotesTabId = 'new';
  @Output() tabChange = new EventEmitter<QuotesTabId>();

  onSelectTab(tabId: QuotesTabId): void {
    if (tabId === this.activeTabId) return;
    this.tabChange.emit(tabId);
  }
}


