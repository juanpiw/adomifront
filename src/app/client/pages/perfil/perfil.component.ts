import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-c-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class ClientPerfilComponent {
  // Datos del perfil
  fullName = 'Laura Sofía Herrera';
  email = 'laura.herrera@correo.com';
  phone = '+56 9 1234 5678';
  dob = '1995-03-15';
  address = 'Av. Siempre Viva 742, Santiago';
  notes = 'Tengo dos gatos muy curiosos, favor asegurar que la puerta esté cerrada. Siempre disponible después de las 3 PM.';
  
  // Estado del formulario
  isSaving = false;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | '' = '';

  // Método para guardar el perfil
  saveProfile(): void {
    // Validación
    if (!this.fullName || !this.phone || !this.address) {
      this.showFeedback('❌ Completa los campos obligatorios (*).', 'error');
      return;
    }

    // Estado de carga
    this.isSaving = true;
    this.feedbackMessage = '';

    // Simular guardado (aquí iría la lógica real de guardado)
    setTimeout(() => {
      this.isSaving = false;
      this.showFeedback('✅ ¡Perfil actualizado con éxito!', 'success');
    }, 1500);
  }

  private showFeedback(message: string, type: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    
    if (type === 'success') {
      setTimeout(() => {
        this.feedbackMessage = '';
        this.feedbackType = '';
      }, 3000);
    }
  }
}
