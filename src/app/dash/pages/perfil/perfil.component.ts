import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { TabsPerfilComponent, TabType } from '../../../../libs/shared-ui/tabs-perfil/tabs-perfil.component';
import { UbicacionDisponibilidadComponent, LocationSettings, CoverageZone } from '../../../../libs/shared-ui/ubicacion-disponibilidad/ubicacion-disponibilidad.component';
import { HorarioDisponibilidadComponent, WeeklySchedule } from '../../../../libs/shared-ui/horario-disponibilidad/horario-disponibilidad.component';
import { ExcepcionesFeriadosComponent, ExceptionDate } from '../../../../libs/shared-ui/excepciones-feriados/excepciones-feriados.component';
import { VerificacionPerfilComponent } from '../../../../libs/shared-ui/verificacion-perfil/verificacion-perfil.component';

@Component({
  selector: 'app-d-perfil',
  standalone: true,
  imports: [
    CommonModule,
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
    PortafolioComponent,
    TabsPerfilComponent,
    UbicacionDisponibilidadComponent,
    HorarioDisponibilidadComponent,
    ExcepcionesFeriadosComponent,
    VerificacionPerfilComponent
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class DashPerfilComponent {
  // Datos básicos del perfil
  name = 'Elena Torres';
  bio = 'Estilista profesional con más de 5 años de experiencia en cortes modernos y coloración. Especializada en técnicas de color y cortes personalizados.';
  phone = '+56 9 1234 5678';
  avatar: string | null = 'https://placehold.co/96x96/C7D2FE/4338CA?text=ET';
  lang = 'es';
  emailNoti = true;
  pushNoti = true;

  // Datos para los nuevos componentes
  basicInfo: BasicInfo = {
    fullName: 'Elena Torres',
    professionalTitle: 'Estilista Profesional',
    mainCommune: 'Providencia',
    yearsExperience: 5
  };

  services: Service[] = [
    { id: '1', name: 'Corte de Pelo', duration: 60, price: 25000 },
    { id: '2', name: 'Manicura', duration: 45, price: 15000 },
    { id: '3', name: 'Maquillaje Profesional', duration: 75, price: 30000 }
  ];

  portfolioImages: PortfolioImage[] = [
    { id: '1', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Corte+1', alt: 'Corte de pelo', type: 'image' },
    { id: '2', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Coloraci%C3%B3n', alt: 'Coloración', type: 'image' }
  ];

  profileProgress = 75;

  // Estado de las tabs
  activeTab: TabType = 'perfil-publico';

  // Estados de carga
  savingPublicProfile = false;

  // Datos para ubicación y disponibilidad
  locationSettings: LocationSettings = {
    availableForNewBookings: true,
    shareRealTimeLocation: false,
    coverageZones: [
      { id: '1', name: 'Providencia' },
      { id: '2', name: 'Las Condes' },
      { id: '3', name: 'Ñuñoa' }
    ]
  };

  // Datos para horario semanal
  weeklySchedule: WeeklySchedule = {
    days: [
      {
        day: 'Lunes',
        enabled: true,
        timeBlocks: [
          { id: '1', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Martes',
        enabled: false,
        timeBlocks: []
      },
      {
        day: 'Miércoles',
        enabled: true,
        timeBlocks: [
          { id: '2', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Jueves',
        enabled: true,
        timeBlocks: [
          { id: '3', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Viernes',
        enabled: true,
        timeBlocks: [
          { id: '4', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Sábado',
        enabled: true,
        timeBlocks: [
          { id: '5', start: '10:00', end: '16:00' }
        ]
      },
      {
        day: 'Domingo',
        enabled: false,
        timeBlocks: []
      }
    ]
  };

  // Datos para excepciones
  exceptions: ExceptionDate[] = [
    {
      id: '1',
      date: '2025-10-05',
      reason: 'Ejemplo: Día de Limpieza/Mantenimiento'
    }
  ];

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

  onProfilePhotoChange(imageUrl: string) {
    console.log('Foto de perfil actualizada:', imageUrl);
    // La imagen se actualiza automáticamente en el componente
  }

  onCoverPhotoChange(imageUrl: string) {
    console.log('Foto de portada actualizada:', imageUrl);
    // La imagen se actualiza automáticamente en el componente
  }

  onAddPortfolioImage() {
    console.log('Agregar imagen al portafolio');
    // TODO: Implementar uploader de imágenes
  }

  onAddPortfolioVideo() {
    console.log('Agregar video al portafolio');
    // TODO: Implementar uploader de videos
  }

  onDeletePortfolioImage(imageId: string) {
    this.portfolioImages = this.portfolioImages.filter(img => img.id !== imageId);
  }

  // Event handlers para tabs
  onTabChange(tab: TabType) {
    this.activeTab = tab;
  }

  // Event handlers para ubicación y disponibilidad
  onLocationSettingsChange(settings: LocationSettings) {
    this.locationSettings = settings;
  }

  onAddCoverageZone(zoneName: string) {
    const newZone: CoverageZone = {
      id: Date.now().toString(),
      name: zoneName
    };
    this.locationSettings = {
      ...this.locationSettings,
      coverageZones: [...this.locationSettings.coverageZones, newZone]
    };
  }

  onRemoveCoverageZone(zoneId: string) {
    this.locationSettings = {
      ...this.locationSettings,
      coverageZones: this.locationSettings.coverageZones.filter(zone => zone.id !== zoneId)
    };
  }

  // Event handlers para horario
  onScheduleChange(schedule: WeeklySchedule) {
    this.weeklySchedule = schedule;
  }

  onAddTimeBlock(data: { day: string; block: any }) {
    console.log('Agregar bloque de tiempo:', data);
    // La lógica ya está en el componente
  }

  onRemoveTimeBlock(data: { day: string; blockId: string }) {
    console.log('Remover bloque de tiempo:', data);
    // La lógica ya está en el componente
  }

  onToggleDay(data: { day: string; enabled: boolean }) {
    console.log('Toggle día:', data);
    // La lógica ya está en el componente
  }

  // Event handlers para excepciones
  onExceptionsChange(exceptions: ExceptionDate[]) {
    this.exceptions = exceptions;
  }

  onAddException(data: { date: string; reason?: string }) {
    console.log('Agregar excepción:', data);
    // La lógica ya está en el componente
  }

  onRemoveException(exceptionId: string) {
    console.log('Remover excepción:', exceptionId);
    // La lógica ya está en el componente
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

  savePublicProfile() {
    this.savingPublicProfile = true;
    
    // Simular llamada al backend
    setTimeout(() => {
      console.log('Guardando perfil público...', {
        basicInfo: this.basicInfo,
        bio: this.bio,
        services: this.services,
        portfolioImages: this.portfolioImages,
        locationSettings: this.locationSettings
      });
      
      // TODO: Implementar llamada real al backend
      // this.profileService.updatePublicProfile(profileData).subscribe({
      //   next: (response) => {
      //     console.log('Perfil público guardado:', response);
      //     this.savingPublicProfile = false;
      //     // Mostrar mensaje de éxito
      //   },
      //   error: (error) => {
      //     console.error('Error al guardar perfil público:', error);
      //     this.savingPublicProfile = false;
      //     // Mostrar mensaje de error
      //   }
      // });
      
      this.savingPublicProfile = false;
    }, 1500);
  }
}
