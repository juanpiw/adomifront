import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientTerminosComponent } from '../../client/pages/terminos/terminos.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, ClientTerminosComponent],
  template: `
    <div class="terms-container">
      <div class="terms-card">
        <app-client-terminos></app-client-terminos>

        <div class="actions">
          <button class="btn-secondary" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver al Registro
          </button>
          <button class="btn-primary" (click)="acceptTerms()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Acepto los Términos
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent {
  constructor(private router: Router) {}

  goBack() {
    window.history.back();
  }

  acceptTerms() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('termsAccepted', 'true');
    }

    this.router.navigate(['/auth/register']);
  }
}








