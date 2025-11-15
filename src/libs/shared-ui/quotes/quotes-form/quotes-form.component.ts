import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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

export interface QuoteAttachmentInput {
  id?: number;
  name?: string | null;
  size?: number | null;
  url?: string | null;
  type?: string | null;
}

interface AttachmentPreview {
  id?: number;
  tempId?: string;
  name: string;
  size?: number | null;
  url?: string | null;
  status: 'uploaded' | 'uploading';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DecimalPipe]
})
export class QuotesFormComponent implements OnChanges {
  @Input() quote!: Quote;
  @Input() loading = false;
  @Input() proposalDetails: { amount?: number | null; details?: string | null; validity?: string | null } | null = null;
  @Input() attachments: QuoteAttachmentInput[] | null = null;
  @Output() send = new EventEmitter<QuoteProposal>();
  @Output() saveDraft = new EventEmitter<QuoteProposal>();
  @Output() chat = new EventEmitter<void>();
  @Output() filesDropped = new EventEmitter<File[]>();
  @Output() manageAppointment = new EventEmitter<Quote>();

  validityOptions = ['10 días', '15 días', '30 días'];

  private readonly fb = inject(FormBuilder);
  private readonly decimalPipe = inject(DecimalPipe);

  formattedAmount = '';
  attachmentPreviews: AttachmentPreview[] = [];
  private uploadedAttachments: AttachmentPreview[] = [];
  private pendingUploads: AttachmentPreview[] = [];

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

  get canManageAppointment(): boolean {
    return this.quote?.status === 'accepted';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quote'] && this.quote) {
      this.patchFromQuote(this.quote);
    }
    if (changes['proposalDetails'] && this.proposalDetails) {
      this.patchFromProposal(this.proposalDetails);
    }
    if (changes['attachments']) {
      this.syncAttachmentsFromInput();
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
    if (files?.length) {
      const timestamp = Date.now();
      const newPending = files.map<AttachmentPreview>((file, index) => ({
        tempId: `pending-${timestamp}-${index}`,
        name: file?.name?.trim() || 'Documento sin nombre',
        size: typeof file?.size === 'number' ? file.size : null,
        status: 'uploading'
      }));
      this.pendingUploads = [...newPending, ...this.pendingUploads];
      this.refreshAttachmentPreviewList();
    }
    this.filesDropped.emit(files);
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

  formatFileSize(bytes?: number | null): string {
    if (bytes === null || bytes === undefined) {
      return '';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = bytes / 1024;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
  }

  trackAttachment(_: number, attachment: AttachmentPreview): number | string {
    return attachment.id ?? attachment.tempId ?? attachment.name;
  }

  private patchFromQuote(quote: Quote): void {
    const normalizedAmount =
      typeof quote.amount === 'number'
        ? quote.amount
        : typeof quote.proposal?.amount === 'number'
          ? quote.proposal.amount
          : null;

    if (normalizedAmount !== null) {
      this.form.patchValue({ amount: normalizedAmount }, { emitEvent: false });
      this.formattedAmount = this.formatCurrency(normalizedAmount);
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

  private formatCurrency(value: number): string {
    return this.decimalPipe.transform(value, '1.0-0', 'es-CL') || '';
  }

  private syncAttachmentsFromInput(): void {
    const incoming =
      this.attachments?.map<AttachmentPreview>((attachment) => ({
        id: attachment.id,
        name: (attachment.name || 'Documento adjunto').trim(),
        size: typeof attachment.size === 'number' ? attachment.size : null,
        url: attachment.url || null,
        status: 'uploaded'
      })) ?? [];

    if (incoming.length) {
      const uploadedNames = new Set(
        incoming.map((attachment) => attachment.name.toLowerCase())
      );
      this.pendingUploads = this.pendingUploads.filter((pending) => {
        const normalizedName = pending.name.toLowerCase();
        return !uploadedNames.has(normalizedName);
      });
    }

    this.uploadedAttachments = incoming;
    this.refreshAttachmentPreviewList();
  }

  private refreshAttachmentPreviewList(): void {
    this.attachmentPreviews = [...this.pendingUploads, ...this.uploadedAttachments];
  }
}

