import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClientRequestPanelComponent } from '../client-request-panel/client-request-panel.component';
import { DropzoneCardComponent } from '../dropzone-card/dropzone-card.component';
import { Quote } from '../quotes.models';
import { IconComponent } from '../../../shared-ui/icon/icon.component';
import { DecimalPipe } from '@angular/common';
import { DecimalPipe } from '@angular/common';

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
  @Input() proposalDetails: { amount?: number | null; details?: string | null; validity?: string | null } | null = null;
  @Output() send = new EventEmitter<QuoteProposal>();
  @Output() saveDraft = new EventEmitter<QuoteProposal>();
  @Output() chat = new EventEmitter<void>();
  @Output() filesDropped = new EventEmitter<File[]>();

  validityOptions = ['10 días', '15 días', '30 días'];

  private readonly fb = inject(FormBuilder);
  private readonly decimalPipe = inject(DecimalPipe);

  formattedAmount = '';
  private readonly decimalPipe = inject(DecimalPipe);

  form = this.fb.nonNullable.group({
    amount: [null as number | null, [Validators.required, Validators.min(1000)]],
    validity: ['15 días', Validators.required],
    details: ['', [Validators.required, Validators.minLength(20)]]
  });

  constructor() {
    this.form.controls.amount.valueChanges.subscribe((value) => {
      if (typeof value === 'number') {
        this.formattedAmount = this.formatCurrency(value);
      } else {
        this.formattedAmount = '';
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quote'] && this.quote) {
      this.patchFromQuote(this.quote);
    }
    if (changes['proposalDetails'] && this.proposalDetails) {
      this.patchFromProposal(this.proposalDetails);
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
      this.formattedAmount = this.formatCurrency(quote.amount);
    } else {
      this.formattedAmount = '';
    }
  }

  private patchFromProposal(proposal: { amount?: number | null; details?: string | null; validity?: string | null }): void {
    if (proposal.amount !== undefined && proposal.amount !== null) {
      this.form.patchValue({ amount: proposal.amount }, { emitEvent: false });
      this.formattedAmount = this.formatCurrency(proposal.amount);
    } else {
      this.formattedAmount = '';
    }
    if (proposal.details) {
      this.form.patchValue({ details: proposal.details }, { emitEvent: false });
    }
    if (proposal.validity) {
      this.form.patchValue({ validity: proposal.validity }, { emitEvent: false });
    }
  }

  onAmountInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const rawValue = target.value.replace(/[^\d]/g, '');
    const parsed = Number(rawValue);

    if (!rawValue) {
      this.form.controls.amount.setValue(null);
      this.formattedAmount = '';
      return;
    }

    if (!Number.isNaN(parsed)) {
      this.form.controls.amount.setValue(parsed);
      this.formattedAmount = this.formatCurrency(parsed);
    }
  }

  private formatCurrency(value: number): string {
    return this.decimalPipe.transform(value, '1.0-0', 'es-CL') || '';
  }
}

