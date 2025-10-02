import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../../auth/services/session.service';
import { IconComponent, IconName } from '../../../../libs/shared-ui/icon/icon.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  currentSlide = 0;
  userRole: 'client' | 'provider' = 'client';

  slides = [
    {
      title: '¡Bienvenido a AdomiApp!',
      description: 'La plataforma que conecta profesionales con clientes de manera fácil y segura.',
      icon: 'welcome',
      image: 'assets/onboarding/welcome.svg'
    },
    {
      title: 'Encuentra Profesionales',
      description: 'Descubre y reserva citas con los mejores profesionales en tu área.',
      icon: 'search',
      image: 'assets/onboarding/search.svg'
    },
    {
      title: 'Gestiona tu Negocio',
      description: 'Si eres profesional, administra tu agenda, clientes y servicios desde un solo lugar.',
      icon: 'business',
      image: 'assets/onboarding/business.svg'
    },
    {
      title: '¡Comienza Ahora!',
      description: 'Estás listo para empezar tu experiencia con AdomiApp.',
      icon: 'rocket',
      image: 'assets/onboarding/rocket.svg'
    }
  ];

  private router = inject(Router);
  private sessionService = inject(SessionService);

  ngOnInit() {
    const user = this.sessionService.getCurrentUser();
    if (user) {
      this.userRole = user.role;
    }
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
    } else {
      this.completeOnboarding();
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  completeOnboarding() {
    // Marcar onboarding como completado
    this.sessionService.setOnboardingCompleted(true);
    
    // Redirigir al dashboard correspondiente
    if (this.userRole === 'provider') {
      this.router.navigate(['/dash/home']);
    } else {
      this.router.navigate(['/client/reservas']);
    }
  }

  skipOnboarding() {
    this.completeOnboarding();
  }

  getSlideIcon(): IconName {
    const icons: IconName[] = ['home', 'home', 'briefcase', 'home']; // Usando iconos disponibles
    return icons[this.currentSlide] || 'home';
  }
}
