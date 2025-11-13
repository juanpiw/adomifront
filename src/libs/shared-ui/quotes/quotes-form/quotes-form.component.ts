import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClientRequestPanelComponent } from '../client-request-panel/client-request-panel.component';
import { DropzoneCardComponent } from '../dropzone-card/dropzone-card.component';
import { Quote } from '../quotes.models';
import { IconComponent } from '../../../shared-ui/icon/icon.component';

export interface QuoteProposal {
  amount: number;
  validity: string;
  details: string;
}

@Component({
  selector: 'ui-quotes-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClientRequestPanelComponent,
    DropzoneCardComponent,
    IconComponent
  ],
  templateUrl: './quotes-form.component.html',
  styleUrls: ['./quotes-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotesFormComponent implements OnChanges {
  @Input() quote!: Quote;
  @Input() loading = false;
  @Output() send = new EventEmitter<QuoteProposal>();
  @Output() saveDraft = new EventEmitter<QuoteProposal>();
  @Output() chat = new EventEmitter<void>();
  @Output() filesDropped = new EventEmitter<File[]>();

  validityOptions = ['10 días', '15 días', '30 días'];

  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    amount: [null as number | null, [Validators.required, Validators.min(1000)]],
    validity: ['15 días', Validators.required],
    details: ['', [Validators.required, Validators.minLength(20)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quote'] && this.quote) {
      this.patchFromQuote(this.quote);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.send.emit(this.form.getRawValue() as QuoteProposal);
  }

  onSaveDraft(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saveDraft.emit(this.form.getRawValue() as QuoteProposal);
  }

  onFilesDropped(files: File[]): void {
    this.filesDropped.emit(files);
  }

  private patchFromQuote(quote: Quote): void {
    if (quote.amount) {
      this.form.patchValue({ amount: quote.amount }, { emitEvent: false });
    }
  }
}

