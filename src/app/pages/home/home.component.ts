import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PromoModalComponent, PromoFormData } from './promocion/promo-modal.component';
import { PromoService } from '../../services/promo.service';

type FounderStatus = 'idle' | 'success' | 'error';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PromoModalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  email = '';
  showPromoModal = false;
  faqOpen: boolean[] = [false, false, false, false];

  // Pricing v2 state
  isAnnual = false;
  readonly prices = {
    pro: { month: '29.000', year: '290.000' },
    scale: { month: '89.000', year: '890.000' }
  } as const;

  // Founder code state
  founderCode = '';
  founderStatus: FounderStatus = 'idle';
  founderShake = false;

  private readonly FOUNDER_CODE = 'ADOMI2025';

  constructor(
    private promoService: PromoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initAnimations();
    this.initScrollAnimations();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // Form submission handlers
  onSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted with email:', this.email);
    // Here you would typically send the email to your backend
    alert('¡Gracias por tu interés! Te contactaremos pronto.');
    this.email = '';
  }

  // Promo modal handlers
  openPromoModal() {
    this.showPromoModal = true;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closePromoModal() {
    this.showPromoModal = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'auto';
    }
  }

  onPromoSubmit(formData: PromoFormData) {
    console.log('Promo form submitted:', formData);
    
    // Enviar datos al backend
    this.promoService.signupForFreeTrial(formData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Signup successful:', response.data);
          // No mostrar alert, el modal se encargará del estado de éxito
          this.closePromoModal();
        } else {
          console.error('Signup failed:', response.error);
          // No mostrar alert, el modal manejará el error
        }
      },
      error: (error) => {
        console.error('Network error:', error);
        // No mostrar alert, el modal manejará el error
      }
    });
  }

  // FAQ handlers
  toggleFaq(index: number) {
    this.faqOpen[index] = !this.faqOpen[index];
  }

  // Pricing v2 helpers
  setBilling(isAnnual: boolean) {
    this.isAnnual = isAnnual;
  }

  toggleBilling() {
    this.isAnnual = !this.isAnnual;
  }

  get billingPeriodLabel() {
    return this.isAnnual ? '/año' : '/mes';
  }

  get proPrice() {
    return this.isAnnual ? this.prices.pro.year : this.prices.pro.month;
  }

  get scalePrice() {
    return this.isAnnual ? this.prices.scale.year : this.prices.scale.month;
  }

  goToRegister(plan: string) {
    void this.router.navigate(['/auth/register'], {
      queryParams: {
        plan,
        billing: this.isAnnual ? 'anual' : 'mensual'
      }
    });
  }

  onFounderCodeChange() {
    if (this.founderStatus !== 'idle') {
      this.founderStatus = 'idle';
    }
    if (this.founderShake) {
      this.founderShake = false;
    }
  }

  get founderButtonText() {
    if (this.founderStatus === 'success') return '¡Código Correcto!';
    if (this.founderStatus === 'error') return 'Código Inválido';
    return 'Validar y Activar';
  }

  validateFounderCodeAndContinue() {
    const code = this.founderCode.trim().toUpperCase();
    if (!code) return;

    if (code === this.FOUNDER_CODE) {
      this.founderStatus = 'success';
      this.goToRegister('Fundador');
      return;
    }

    this.founderStatus = 'error';
    this.founderShake = true;
    setTimeout(() => {
      this.founderShake = false;
    }, 550);
  }

  // Animation initialization
  private initAnimations() {
    // Check if we're in browser environment
    if (typeof document !== 'undefined') {
      // Smooth scrolling for navigation links
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.matches('a[href^="#"]')) {
          e.preventDefault();
          const targetId = target.getAttribute('href')?.substring(1);
          if (targetId) {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        }
      });
    }
  }

  private initScrollAnimations() {
    // Check if we're in browser environment
    if (typeof document !== 'undefined' && typeof IntersectionObserver !== 'undefined') {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      }, observerOptions);

      // Observe elements with animation classes
      setTimeout(() => {
        const animatedElements = document.querySelectorAll('.fade-in-up, .animate-fade-in-up');
        animatedElements.forEach(el => observer.observe(el));
      }, 100);
    }
  }
}
