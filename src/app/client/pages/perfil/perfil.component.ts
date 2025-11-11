import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientProfileService, SaveClientProfilePayload } from '../../../services/client-profile.service';
import { environment } from '../../../../environments/environment';
import { ClientVerificacionPerfilComponent } from '../../../../libs/shared-ui/verificacion-perfil/client-verificacion-perfil.component';
import { ClientVerificationStatus } from '../../../services/client-verification.service';

@Component({
  selector: 'app-c-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientVerificacionPerfilComponent],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class ClientPerfilComponent implements OnInit {
  private clientProfileService = inject(ClientProfileService);

  // Datos del perfil
  fullName = '';
  email = '';
  phone = '';
  dob = '';
  address = '';
  commune = '';
  region = '';
  notes = '';
  profilePhotoUrl = '';
  memberSinceLabel = 'Cliente Adomi';
  verificationStatus: ClientVerificationStatus = 'none';
  verificationLoading = true;
  
  // Estado del formulario
  isSaving = false;
  isLoading = true;
  isUploadingPhoto = false;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | '' = '';
  
  // Preview de la foto
  photoPreview: string | null = null;

  // URL completa de la foto
  get fullPhotoUrl(): string {
    if (!this.profilePhotoUrl) return '';
    // Si ya es una URL completa, retornarla
    if (this.profilePhotoUrl.startsWith('http')) {
      return this.profilePhotoUrl;
    }
    // Si es una ruta relativa, construir URL completa
    const baseUrl = environment.apiBaseUrl;
    return `${baseUrl}${this.profilePhotoUrl}`;
  }

  ngOnInit() {
    this.loadProfile();
  }

  onVerificationStatusChange(status: ClientVerificationStatus) {
    this.verificationStatus = status || 'none';
    this.verificationLoading = false;
  }

  get verificationStatusVariant(): 'approved' | 'pending' | 'rejected' | 'none' {
    switch (this.verificationStatus) {
      case 'approved':
        return 'approved';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      default:
        return 'none';
    }
  }

  get verificationStatusLabel(): string {
    switch (this.verificationStatusVariant) {
      case 'approved':
        return 'Identidad verificada';
      case 'pending':
        return 'Verificación en revisión';
      case 'rejected':
        return 'Verificación rechazada';
      default:
        return 'Identidad no verificada';
    }
  }

  /**
   * Cargar perfil del usuario
   */
  private loadProfile() {
    console.log('[PERFIL] 🔍 Cargando perfil del usuario...');
    this.isLoading = true;

    // Cargar email del usuario desde localStorage
    const userStr = localStorage.getItem('adomi_user');
    if (userStr && userStr !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
        this.email = user.email || '';
      } catch (error) {
        console.error('[PERFIL] Error al parsear usuario:', error);
      }
    }

    this.clientProfileService.getProfile().subscribe({
      next: (response) => {
        console.log('[PERFIL] ✅ Perfil cargado:', response);
        
        if (response.success && response.profile) {
          this.fullName = response.profile.full_name || '';
          this.phone = response.profile.phone || '';
          this.address = response.profile.address || '';
          this.commune = response.profile.commune || '';
          this.region = response.profile.region || '';
          this.profilePhotoUrl = response.profile.profile_photo_url || '';
          this.memberSinceLabel = this.buildMemberSinceLabel(response.profile.created_at);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('[PERFIL] ❌ Error al cargar perfil:', error);
        this.isLoading = false;
        // Continuar con campos vacíos
      }
    });
  }

  /**
   * Manejar cambio de archivo de foto de perfil
   */
  onPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    console.log('[PERFIL] 📸 Archivo seleccionado:', file.name, file.size);

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.showFeedback('❌ Solo se permiten archivos de imagen', 'error');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      this.showFeedback('❌ La imagen debe ser menor a 5MB', 'error');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Subir archivo
    this.uploadPhoto(file);
  }

  /**
   * Subir foto de perfil al servidor
   */
  private uploadPhoto(file: File) {
    console.log('[PERFIL] 📤 Subiendo foto al servidor...');
    this.isUploadingPhoto = true;

    this.clientProfileService.uploadProfilePhoto(file).subscribe({
      next: (response) => {
        console.log('[PERFIL] ✅ Foto subida:', response);
        this.isUploadingPhoto = false;
        
        if (response.success && response.photoUrl) {
          this.profilePhotoUrl = response.photoUrl;
          this.showFeedback('✅ Foto de perfil actualizada', 'success');
        } else {
          this.showFeedback('❌ ' + (response.error || 'Error al subir foto'), 'error');
        }
      },
      error: (error) => {
        console.error('[PERFIL] ❌ Error al subir foto:', error);
        this.isUploadingPhoto = false;
        this.photoPreview = null;
        this.showFeedback('❌ Error al subir la foto. Intenta de nuevo.', 'error');
      }
    });
  }

  /**
   * Trigger para abrir selector de archivo
   */
  triggerPhotoUpload() {
    const fileInput = document.getElementById('photoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Guardar el perfil
   */
  saveProfile(): void {
    console.log('[PERFIL] 💾 Intentando guardar perfil...');
    
    // Validación
    if (!this.fullName || !this.phone || !this.address || !this.commune || !this.region) {
      this.showFeedback('❌ Completa los campos obligatorios (*).', 'error');
      return;
    }

    // Estado de carga
    this.isSaving = true;
    this.feedbackMessage = '';

    const payload: SaveClientProfilePayload = {
      full_name: this.fullName.trim(),
      phone: this.phone.trim(),
      address: this.address.trim(),
      commune: this.commune.trim(),
      region: this.region.trim(),
      preferred_language: 'es',
      notes: this.notes.trim()
    };

    console.log('[PERFIL] 📝 Enviando datos:', payload);

    this.clientProfileService.saveProfile(payload).subscribe({
      next: (response) => {
        console.log('[PERFIL] ✅ Respuesta del servidor:', response);
        this.isSaving = false;
        
        if (response.success) {
          this.showFeedback('✅ ¡Perfil actualizado con éxito!', 'success');
          
          // El servicio ya revalidó el perfil automáticamente
          // El modal debería desaparecer si ahora está completo
        } else {
          this.showFeedback('❌ ' + (response.error || 'Error al guardar'), 'error');
        }
      },
      error: (error) => {
        console.error('[PERFIL] ❌ Error al guardar:', error);
        this.isSaving = false;
        this.showFeedback('❌ Error al guardar el perfil. Intenta de nuevo.', 'error');
      }
    });
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

  private buildMemberSinceLabel(createdAt?: string | null): string {
    if (!createdAt) {
      return 'Cliente Adomi';
    }
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return 'Cliente Adomi';
    }
    const formatter = new Intl.DateTimeFormat('es-CL', {
      month: 'long',
      year: 'numeric'
    });
    const formatted = formatter.format(date);
    // Capitalizar primera letra del mes
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    return `Cliente Adomi desde ${capitalized}`;
  }
}
