import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiInputVariant = 'default' | 'underline' | 'outline' | 'filled' | 'ghost' | 'search' | 'password' | 'textarea' | 'select' | 'with-icon';
export type UiInputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.scss']
})
export class UiInputComponent {
  @Input() variant: UiInputVariant = 'default';
  @Input() size: UiInputSize = 'md';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'search' | 'number' | 'file' = 'text';
  @Input() togglePassword = true; // muestra/oculta botón de ojo cuando type==='password'
  @Input() value: string | number | null = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() error: string | null = null;
  @Input() hint: string | null = null;
  @Input() iconLeft: string | null = null;
  @Input() iconRight: string | null = null;

  @Output() valueChange = new EventEmitter<string | number | File | null>();

  protected inputId = `ui-input-${Math.random().toString(36).slice(2)}`;
  protected showPassword = signal(false);

  protected resolvedType = computed(() => {
    if (this.type === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type;
  });

  protected classes = computed(() => {
    const base = ['ui-input'];
    base.push(`variant-${this.variant}`);
    base.push(`size-${this.size}`);
    if (this.error) base.push('has-error');
    if (this.disabled) base.push('is-disabled');
    return base.join(' ');
  });

  onInput(ev: Event) {
    const target = ev.target as HTMLInputElement | HTMLTextAreaElement;
    const val = this.type === 'number' ? Number(target.value) : target.value;
    this.valueChange.emit(val);
  }

  togglePwVisibility() {
    if (this.type !== 'password') return;
    this.showPassword.update(v => !v);
  }

  onFileChange(ev: Event) {
    if (this.type !== 'file') return;
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.valueChange.emit(file);
  }
}

