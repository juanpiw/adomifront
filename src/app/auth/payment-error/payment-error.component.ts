import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-error.component.html',
  styleUrls: ['./payment-error.component.scss']
})
export class PaymentErrorComponent implements OnInit {
  errorMessage: string = 'Error en el proceso de pago';

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    // Obtener mensaje de error de la URL si existe
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      this.errorMessage = decodeURIComponent(error);
    }
  }

  goToRegister() {
    // Limpiar datos temporales
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('tempUserData');
      sessionStorage.removeItem('selectedPlan');
    }
    
    this.router.navigateByUrl('/auth/register');
  }

  goToSelectPlan() {
    this.router.navigateByUrl('/auth/select-plan');
  }

  retryPayment() {
    this.router.navigateByUrl('/auth/checkout');
  }
}
