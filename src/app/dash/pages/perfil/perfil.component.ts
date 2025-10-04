import { Component } from '@angular/core';
import { UiInputComponent } from '../../../../libs/shared-ui/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../../libs/shared-ui/ui-button/ui-button.component';
import { AvatarUploaderComponent } from '../../../../libs/shared-ui/avatar-uploader/avatar-uploader.component';
import { LanguageSelectComponent } from '../../../../libs/shared-ui/language-select/language-select.component';
import { NotificationToggleComponent } from '../../../../libs/shared-ui/notification-toggle/notification-toggle.component';
import { InfoBasicaComponent, BasicInfo } from '../../../../libs/shared-ui/info-basica/info-basica.component';
import { MisServiciosComponent, Service } from '../../../../libs/shared-ui/mis-servicios/mis-servicios.component';
import { SobreMiComponent } from '../../../../libs/shared-ui/sobre-mi/sobre-mi.component';
import { ProgressPerfilComponent } from '../../../../libs/shared-ui/progress-perfil/progress-perfil.component';
import { SeccionFotosComponent } from '../../../../libs/shared-ui/seccion-fotos/seccion-fotos.component';
import { PortafolioComponent, PortfolioImage } from '../../../../libs/shared-ui/portafolio/portafolio.component';

@Component({
  selector: 'app-d-perfil',
  standalone: true,
  imports: [
    UiInputComponent, 
    UiButtonComponent, 
    AvatarUploaderComponent, 
    LanguageSelectComponent, 
    NotificationToggleComponent,
    InfoBasicaComponent,
    MisServiciosComponent,
    SobreMiComponent,
    ProgressPerfilComponent,
    SeccionFotosComponent,
    PortafolioComponent
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class DashPerfilComponent {
  // Datos básicos del perfil
  name = '';
  bio = '';
  phone = '';
  avatar: string | null = null;
  lang = 'es';
  emailNoti = true;
  pushNoti = true;

  // Datos para los nuevos componentes
  basicInfo: BasicInfo = {
    fullName: 'Elena Torres',
    professionalTitle: 'Estilista Profesional',
    mainCommune: 'Providencia'
  };

  services: Service[] = [
    { id: '1', name: 'Corte de Pelo', duration: 60, price: 25000 },
    { id: '2', name: 'Manicura', duration: 45, price: 15000 },
    { id: '3', name: 'Maquillaje Profesional', duration: 75, price: 30000 }
  ];

  portfolioImages: PortfolioImage[] = [
    { id: '1', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Corte+1', alt: 'Corte de pelo' },
    { id: '2', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Coloraci%C3%B3n', alt: 'Coloración' }
  ];

  profileProgress = 75;

  // Event handlers para los componentes
  onBasicInfoChange(info: BasicInfo) {
    this.basicInfo = info;
  }

  onEditService(service: Service) {
    console.log('Editar servicio:', service);
    // TODO: Implementar modal de edición
  }

  onDeleteService(serviceId: string) {
    this.services = this.services.filter(s => s.id !== serviceId);
  }

  onAddService() {
    console.log('Agregar nuevo servicio');
    // TODO: Implementar modal de agregar servicio
  }

  onBioChange(bio: string) {
    this.bio = bio;
  }

  onProfilePhotoChange() {
    console.log('Cambiar foto de perfil');
    // TODO: Implementar uploader de foto
  }

  onCoverPhotoChange() {
    console.log('Cambiar foto de portada');
    // TODO: Implementar uploader de portada
  }

  onAddPortfolioImage() {
    console.log('Agregar imagen al portafolio');
    // TODO: Implementar uploader de imágenes
  }

  onDeletePortfolioImage(imageId: string) {
    this.portfolioImages = this.portfolioImages.filter(img => img.id !== imageId);
  }

  save() { 
    console.log('Guardando perfil...', {
      name: this.name,
      bio: this.bio,
      phone: this.phone,
      avatar: this.avatar,
      basicInfo: this.basicInfo,
      services: this.services,
      portfolioImages: this.portfolioImages
    });
    // TODO: Implementar persistencia
  }
}
