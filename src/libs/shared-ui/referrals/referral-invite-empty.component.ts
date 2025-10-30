import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnChanges, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ui-referral-invite-empty',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './referral-invite-empty.component.html',
  styleUrls: ['./referral-invite-empty.component.scss']
})
export class UiReferralInviteEmptyComponent implements OnChanges {
  @Input() searchTerm: string = '';
  @Input() locationLabel: string | null = null;
  @Input() shareDisabled = false;
  @Input() loadingChannel: 'email' | 'whatsapp' | 'copy' | null = null;
  @Input() copySuccess = false;
  @Input() emailSuccess = false;

  @Output() whatsapp = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() emailInvite = new EventEmitter<string>();

  emailVisible = false;
  emailValue = '';
  emailError = '';
  copyFeedback = false;
  private copyFeedbackTimeout: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['copySuccess'] && changes['copySuccess'].currentValue === true) {
      this.showCopyFeedback();
    }
    if (changes['emailSuccess'] && changes['emailSuccess'].currentValue === true) {
      this.emailValue = '';
      this.emailVisible = false;
      this.emailError = '';
    }
  }

  onWhatsappClick(): void {
    if (this.shareDisabled || this.loadingChannel === 'whatsapp') return;
    this.whatsapp.emit();
  }

  onCopyClick(): void {
    if (this.shareDisabled || this.loadingChannel === 'copy') return;
    this.copy.emit();
  }

  toggleEmail(): void {
    if (this.shareDisabled) return;
    this.emailVisible = !this.emailVisible;
    this.emailError = '';
    if (!this.emailVisible) {
      this.emailValue = '';
    }
  }

  submitEmail(): void {
    if (this.shareDisabled || this.loadingChannel === 'email') return;
    const email = this.emailValue.trim();
    if (!email) {
      this.emailError = 'Ingresa un correo electrónico.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.emailError = 'Correo electrónico inválido.';
      return;
    }
    this.emailError = '';
    this.emailInvite.emit(email);
  }

  private showCopyFeedback(): void {
    if (this.copyFeedbackTimeout) {
      clearTimeout(this.copyFeedbackTimeout);
    }
    this.copyFeedback = true;
    this.copyFeedbackTimeout = setTimeout(() => {
      this.copyFeedback = false;
    }, 2500);
  }
}


