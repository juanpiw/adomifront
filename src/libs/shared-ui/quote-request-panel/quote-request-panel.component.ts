import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QuotesClientService } from '../../../app/services/quotes-client.service';
import { IconComponent } from '../icon/icon.component';

interface QuoteRequestServiceOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-quote-request-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent],
  templateUrl: './quote-request-panel.component.html',
  styleUrls: ['./quote-request-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuoteRequestPanelComponent implements OnChanges {
  @Input() providerId!: number;
  @Input() providerName = '';
  @Input() services: Array<QuoteRequestServiceOption | string> = [];
  @Input() clientName?: string | null;
  @Input() clientEmail?: string | null;
  @Input() isClientAuthenticated = false;
  @Input() isProviderPioneer = false;

  @Output() requestSent = new EventEmitter<number>();

  form: FormGroup;
  sending = false;
  sentQuoteId: number | null = null;
  successMessage = '';
  errorMessage = '';
  attachments: File[] = [];
  maxAttachments = 5;
  readonly preferredTimeRanges: string[] = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00'
  ];

  helpOpen: 'date' | 'time' | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly quotes = inject(QuotesClientService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.form = this.fb.group({
      service: [''],
      message: ['', [Validators.required, Validators.minLength(20)]],
      preferredDate: [''],
      preferredTimeRange: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['services']) {
      this.normalizeServices();
    }
  }

  get serviceOptions(): QuoteRequestServiceOption[] {
    return this.services as QuoteRequestServiceOption[];
  }

  get messageControl() {
    return this.form.get('message');
  }

  toggleHelp(which: 'date' | 'time', event: MouseEvent): void {
    event.stopPropagation();
    this.helpOpen = this.helpOpen === which ? null : which;
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.helpOpen !== null) {
      this.helpOpen = null;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.helpOpen !== null) {
      this.helpOpen = null;
      this.cdr.markForCheck();
    }
  }

  onSubmit(): void {
    if (!this.isClientAuthenticated) {
      this.errorMessage = 'Inicia sesión como cliente para solicitar una cotización.';
      return;
    }
    if (!this.providerId) {
      this.errorMessage = 'No pudimos identificar al profesional. Intenta recargar la página.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { service, message, preferredDate, preferredTimeRange } = this.form.value;
    const serviceValue = typeof service === 'string' ? service : '';
    const messageValue = typeof message === 'string' ? message : '';

    this.sending = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.sentQuoteId = null;

    this.quotes.createRequest({
      providerId: this.providerId,
      serviceSummary: serviceValue,
      message: messageValue,
      preferredDate: preferredDate || null,
      preferredTimeRange: preferredTimeRange || null,
      attachments: this.attachments
    }).subscribe({
      next: (resp) => {
        this.sending = false;
        if (resp.success) {
          this.sentQuoteId = resp.quoteId ?? null;
          this.successMessage = 'Tu solicitud fue enviada. Te avisaremos cuando el profesional responda.';
          this.form.reset();
          this.attachments = [];
          this.requestSent.emit(this.sentQuoteId ?? 0);
        } else {
          this.errorMessage = resp.error || 'No pudimos enviar tu solicitud. Intenta nuevamente.';
        }
      },
      error: (err) => {
        this.sending = false;
        this.errorMessage = err?.error?.error || err?.error?.message || 'Ocurrió un error al enviar la cotización.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const newFiles: File[] = Array.from(input.files);
    const combined = [...this.attachments, ...newFiles];
    if (combined.length > this.maxAttachments) {
      this.errorMessage = `Puedes adjuntar máximo ${this.maxAttachments} archivos.`;
      this.attachments = combined.slice(0, this.maxAttachments);
    } else {
      this.attachments = combined;
      this.errorMessage = '';
    }
    input.value = '';
  }

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  private normalizeServices(): void {
    this.services = (this.services || []).map((service, index) => {
      if (typeof service === 'string') {
        return { id: String(index), name: service };
      }
      return {
        id: String((service as QuoteRequestServiceOption).id ?? index),
        name: String((service as QuoteRequestServiceOption).name ?? 'Servicio')
      };
    });
  }
}

