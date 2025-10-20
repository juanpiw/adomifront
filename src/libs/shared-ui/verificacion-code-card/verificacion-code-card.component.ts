import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-verificacion-code-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verificacion-code-card.component.html',
  styleUrls: ['./verificacion-code-card.component.scss']
})
export class VerificacionCodeCardComponent {
  @Input() code: string = '';
  @Input() showInline: boolean = false; // Si false, muestra card completo. Si true, solo muestra código inline
  
  copySuccess: boolean = false;
  
  get codeDigits(): string[] {
    if (!this.code) return ['', '', '', ''];
    return this.code.padEnd(4, ' ').split('').slice(0, 4);
  }
  
  copyCode(): void {
    if (!this.code) return;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.code).then(() => {
        this.copySuccess = true;
        setTimeout(() => {
          this.copySuccess = false;
        }, 2000);
      }).catch(err => {
        console.error('Error copiando código:', err);
        this.fallbackCopy();
      });
    } else {
      this.fallbackCopy();
    }
  }
  
  private fallbackCopy(): void {
    // Fallback para navegadores sin clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = this.code;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
  }
}

