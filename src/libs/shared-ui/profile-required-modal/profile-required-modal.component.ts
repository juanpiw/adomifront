import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-required-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-required-modal.component.html',
  styleUrls: ['./profile-required-modal.component.scss']
})
export class ProfileRequiredModalComponent implements OnInit {
  @Input() missingFields: string[] = [];
  @Input() userType: 'client' | 'provider' = 'client';
  
  private router = inject(Router);
  
  ngOnInit() {
    console.log('[PROFILE_REQUIRED_MODAL] Componente inicializado');
    console.log('[PROFILE_REQUIRED_MODAL] Campos faltantes:', this.missingFields);
    console.log('[PROFILE_REQUIRED_MODAL] Tipo de usuario:', this.userType);
  }

  goToProfile() {
    console.log('[PROFILE_REQUIRED_MODAL] Redirigiendo al perfil');
    
    if (this.userType === 'client') {
      this.router.navigate(['/client/perfil']);
    } else if (this.userType === 'provider') {
      this.router.navigate(['/dash/perfil']);
    }
  }
}

